import winston from 'winston';
winston.cli({
  colorize: true
});

import Promise from 'bluebird';
import values from 'lodash/values';
import each from 'lodash/each';
import map from 'lodash/map';
import isUndefined from 'lodash/isUndefined';
import moment from 'moment';
import fs from 'fs-extra';
Promise.promisifyAll(fs);
import rimraf from 'rimraf';
import logger from 'winston';
import glob from 'glob';
import * as CONSTANTS from './constants';
import config from './config';
import Url from './url';
import Render from './render';
import Plugin from './plugin/index';
import Theme from './theme';
import * as Collection from './collection';
import File from './file';

export default class Yarn {
  constructor(rootPath) {
    if (isUndefined(rootPath)) {
      rootPath = config.findLocal().replace(CONSTANTS.YAML.CONFIG, '');
    }

    /**
     * Expose config object on instance.
     * @type {Config}
     */
    this.config = config;

    // Update root path.
    this.config.setRoot(rootPath);

    /**
     * All files found in our source path.
     * Key is the full path to the file, value is the actual File object.
     * @type {Object.<string, File>}
     */
    this.files = Object.create(null);

    /**
     * Mapping of Collection IDs to the instance.
     * @type {Object.<string, Collection>}
     */
    this.collections = Object.create(null);

    /**
     * Class responsible for handling themes.
     * @type {Theme}
     */
    this.theme = new Theme();

    /**
     * Site wide data available in all templates.
     * @type {Object.<string, Object>}
     */
    this.data = Object.create(null);

    /**
     * Expose collections.
     * @type {Object}
     */
    this.data.collections = Object.create(null);

    // Subscribe to when config is updated.
    config.on(config.EVENTS.CONFIG_UPDATED, this.configUpdated.bind(this));

    // Kick off leading config update.
    this.configUpdated();
  }

  configUpdated() {
    this.theme.update();

    // Configure template engine.
    Render.configureTemplate({
      paths: [
        this.theme.config.path.templates
      ]
    });

    // Configure markdown engine.
    Render.configureMarkdown(config.remarkable);

    /**
     * Expose site data from config file.
     * @type {Object}
     */
    this.data.site = config.site;

    // Update our collection configs.
    map(config.collections, (collectionConfig, collectionName) => {
      let instance = Collection.create(collectionName, collectionConfig);

      this.collections[instance.id] = instance;
    });
  }

  getYarnData() {
    const packageJson = Url.pathFromRoot('./package.json');

    return {
      version: packageJson.version,
      time: moment((new Date()).getTime()).format()
    };
  }

  async readFiles() {
    await this.readTheme();

    logger.info('Loading plugins...');
    // Built-in plugins.
    Plugin.loadFromPackageJson(Url.pathFromRoot('./'));
    [
      this.theme.config.path.plugins, // Active theme plug-ins
      config.path.plugins // Site plug-ins
    ].forEach(path => Plugin.loadFromDirectory(path));
    logger.info('\tdone!');

    logger.info('Reading files...');
    let ignorePatterns = values(CONSTANTS.YAML).concat(
      values(config.path).filter(path => path !== config.path.source)
    );

    each(this.collections, collection => {
      if (collection.static) {
        ignorePatterns.push(collection.path);
      }
    });

    let files = await Promise.fromCallback(cb => {
      glob(config.path.source + '/**/*', {
        nodir: true,
        ignore: ignorePatterns.map(path => `**/${path}/**`).concat(
          `${config.path.source}/node_modules/**`
        ),
        // Follow symlinks.
        follow: true
      }, cb);
    });

    files.map(filePath => {
      let sourceFile = new File(filePath);
      this.files[sourceFile.id] = sourceFile;
    });

    // Populate every collection with its files.
    each(this.collections, collection => {
      collection.populate(this.files, this.collections);

      // Add collection data to our global data object.
      this.data.collections[collection.name] = collection.data;
    });

    logger.info('\tdone!');

    return Promise.resolve();
  }

  /**
   * Read theme files, processing any files that it needs to so that we get
   * the final path to the ready to write files.
   * @return {Proise} Promise object.
   */
  async readTheme() {
    let promise;

    // Reading theme files.
    logger.info('Reading theme files...');
    try {
      promise = await this.theme.read();
    } catch (e) {
      logger.error(e);
    }
    logger.info('\tdone!');

    // Expose theme data globally.
    this.data.theme = this.theme.data;

    return promise;
  }

  /**
   * Given a File we will write its contents and all related CollectionPages
   * that it exists to the destination directory.
   * @param {File} file File object.
   * @return {Promise} Promise containing all file system write promises.
   */
  async writeFile(file) {
    let promises = [];

    // For every collectionId the File belongs to rewrite that File within
    // the collection along with every CollectionPage.
    file.collectionIds.forEach(collectionId => {
      let collection = this.collections[collectionId];
      promises.push(collection.writeFile(file, this.data));

      collection.pages.forEach(page => {
        if (file.pageIds.has(page.id)) {
          promises.push(collection.writePage(page, this.data));
        }
      });
    });

    let promise;
    try {
      promise = await Promise.all(promises);
    } catch (e) {
      logger.warn(e);
    }

    return promise;
  }

  /**
   * Notify instance that a file changed so we can then update and re-write
   * the compiled file and associated collection page files.
   * @param {string} filePath File path.
   * @return {Promise} Promise object.
   */
  async fileChanged(filePath) {
    let file = this.files[filePath];

    if (isUndefined(file)) {
      return;
    }

    // Update our in memory File state with data from the file system.
    file.updateDataFromFileSystem();

    return this.writeFile(file);
  }

  /**
   * Notify instance that a file was added to the project so we can update and
   * re-write the compiled file and associated collection page files.
   * @param {string} filePath File path.
   * @return {Promise} Promise object resolving with created File object if one
   *   is created, or false if none is created.
   */
  async fileAdded(filePath) {
    let file = this.files[filePath];

    // Return early if File already exists.
    if (!isUndefined(file)) {
      return false;
    }

    file = new File(filePath);
    this.files[file.id] = file;

    let shouldWriteFile = false;

    // Populate every collection with its files.
    each(this.collections, collection => {
      let fileAdded;
      // @TODO: support adding files to static collections.
      if (collection.addFile) {
        fileAdded = collection.addFile(file);
      }

      if (fileAdded) {
        shouldWriteFile = true;
        collection.createCollectionPages();
      }
    });

    // Write changes to file system.
    if (shouldWriteFile) {
      await this.writeFile(file);
    }

    return file;
  }

  /**
   * Notify instance that a file was removed from the project so we can update
   * and re-write the destination folder without the file and its associated
   * pages.
   * @param {string} filePath File path.
   * @return {Promise} Promise object resolving with true if the File was
   *   removed, false if it wasn't.
   */
  async fileRemoved(filePath) {
    let file = this.files[filePath];

    // Return early if File does not exist.
    if (isUndefined(file)) {
      return false;
    }

    // Remove File.
    delete this.files[file.id];

    let promises = [];

    // Delete file.
    promises.push(fs.removeAsync(file.destination));

    // For every collectionId the File belongs to rewrite that File within
    // the collection along with every CollectionPage.
    file.collectionIds.forEach(collectionId => {
      let collection = this.collections[collectionId];

      // @TODO: support removing static files.
      if (collection.removeFile) {
        collection.removeFile(file);
      }

      // Update collection pages.
      collection.createCollectionPages();

      // Write all CollectionPages to disk.
      collection.pages.forEach(collectionPage => {
        promises.push(collection.writePage(collectionPage, this.data));
      });
    });

    try {
      await Promise.all(promises);
    } catch (e) {
      logger.warn(e);
    }

    return true;
  }

  /**
   * Removes configured destination directory and all files contained.
   * @return {Promise} Promise object.
   */
  async cleanDestination() {
    let promise;

    logger.info('Cleaning destination %s', config.path.destination);
    try {
      promise = await Promise.fromCallback(cb => {
        rimraf(config.path.destination, cb);
      });
    } catch (e) {
      logger.error(e);
    }

    logger.info('\tdone!');

    return promise;
  }

  /**
   * Writes Theme files and assets to file system.
   * @return {Promise} Promise object.
   */
  async writeThemeFiles() {
    let promise;

    // Write theme static files.
    logger.info('Writing theme files...');
    try {
      promise = await this.theme.write();
    } catch (e) {
      logger.error(e);
    }
    logger.info('\tdone!');

    return promise;
  }

  /**
   * Builds the yarn site in its entirety.
   * @return {Promise} Promise of when we're done building.
   */
  async build() {
    let promise;

    if (config.clean_destination) {
      promise = await this.cleanDestination();
    }

    this.data.yarn = this.getYarnData();

    await this.writeThemeFiles();

    logger.info('Writing files...');
    try {
      promise = await Promise.all(map(this.collections, collection => {
        return collection.write(this.data);
      }));
    } catch (e) {
      logger.error(e);
    }
    logger.info('\tdone!');

    return promise;
  }
}
