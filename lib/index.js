import winston from 'winston';
winston.cli({
  colorize: true
});

import path from 'path';
import Promise from 'bluebird';
import values from 'lodash/object/values';
import each from 'lodash/collection/each';
import map from 'lodash/collection/map';
import isUndefined from 'lodash/lang/isUndefined';
import rimraf from 'rimraf';
import logger from 'winston';
import glob from 'glob';
import * as CONSTANTS from './constants';
import config from './config';
import Render from './render';
import Plugin from './plugin/index';
import Theme from './theme';
import * as Collection from './collection';
import File from './file';

export default class Yarn {
  constructor(rootPath = path.resolve(process.cwd())) {
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
    Render.configureTemplate([
      this.theme.config.path.templates
    ]);

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

  async readFiles() {
    await this.readTheme();

    logger.info('Loading plugins...');
    // Built-in plugins.
    Plugin.loadFromPackageJson(path.resolve(__dirname, '../'));
    [
      this.theme.config.path.plugins, // Active theme plug-ins
      config.path.plugins // Site plug-ins
    ].forEach(path => Plugin.loadFromDirectory(path));
    logger.info('\tdone!');

    logger.info('Reading files...');
    let ignorePatterns = [
      'node_modules'
    ].concat(values(CONSTANTS.YAML)).concat(
      values(config.path).filter(path => path !== config.path.source)
    );

    each(this.collections, collection => {
      if (collection.static) {
        ignorePatterns.push(collection.path);
      }
    });

    let files = await Promise.fromNode(cb => {
      glob(config.path.source + '/**/*', {
        nodir: true,
        ignore: ignorePatterns.map(path => `**/${path}/**`)
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
   * Update and write an individual File and its related pages.
   * @param {string} fileId File path.
   * @return {Promise} Promise object.
   */
  async writeFile(fileId) {
    let file = this.files[fileId];

    if (isUndefined(file)) {
      return;
    }

    file.updateDataFromFileSystem();

    let promises = [];

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
   * Removes configured destination directory and all files contained.
   * @return {Promise} Promise object.
   */
  async cleanDestination() {
    let promise;

    logger.info('Cleaning destination %s', config.path.destination);
    try {
      promise = await Promise.fromNode(cb => {
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
