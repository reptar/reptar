import Promise from 'bluebird';
import values from 'lodash/values';
import each from 'lodash/each';
import reduce from 'lodash/reduce';
import map from 'lodash/map';
import isNil from 'lodash/isNil';
import moment from 'moment';
import fs from 'fs-extra';
Promise.promisifyAll(fs);
import rimraf from 'rimraf';
import glob from 'glob';
import log from './log';
import cache from './cache';
import * as CONSTANTS from './constants';
import Config, {
  EVENTS,
} from './config';
import Url from './url';
import {
  configureTemplateEngine,
} from './template';
import {
  configureMarkdownEngine,
} from './markdown';
import Plugin from './plugin/index';
import Theme from './theme';
import {
  createCollection,
} from './collection';
import File from './file';

export default class Yarn {
  /**
   * Create a new Yarn instance.
   * @param {Object} options Options object.
   * @param {string} options.rootPath Where the root path of this Yarn instance
   *   points to.
   * @param {boolean} options.incremental If we should incremental build files.
   */
  constructor(options = {}) {
    /**
     * Expose config object on instance.
     * @type {Config}
     */
    this.config = new Config();

    const rootPath = isNil(options.rootPath) ?
      this.config.findLocalDir() :
      options.rootPath;

    // Update root path.
    this.config.setRoot(rootPath);

    // Options passed into constructor take precedence over the config value.
    // We default to loading cache, unless explicitly set to false.
    const shouldLoadCache = !isNil(options.incremental) ?
      options.incremental !== false :
      this.config.get('incremental') !== false;
    if (shouldLoadCache) {
      cache.load();
    }

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
    this.theme.setGetConfig(this.getConfig);

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

    // Kick off leading config update.
    this.updateConfig();
  }

  /**
   * Returns our config instance.
   * @return {Object}
   */
  getConfig = () => {
    return this.config;
  };

  updateConfig() {
    Url.setSlugOptions(this.config.get('slug'));

    this.theme.update();

    // Configure template engine.
    configureTemplateEngine({
      paths: this.theme.config.path.templates
    });

    // Configure markdown engine.
    configureMarkdownEngine(this.config.get('remarkable'));

    /**
     * Expose site data from config file.
     * @type {Object}
     */
    this.data.site = this.config.get('site');

    // Update our collection configs.
    map(this.config.get('collections'), (collectionConfig, collectionName) => {
      let instance = createCollection(
        collectionName,
        collectionConfig,
        this.getConfig
      );

      this.collections[instance.id] = instance;
    });
  }

  loadPlugins() {
    const id = log.startActivity('Loading plugins.\t\t');

    // Built-in plugins.
    Plugin.loadFromPackageJson(
      Url.pathFromRoot('./'),
      this.config.get('plugins')
    );
    [
      this.theme.config.path.plugins, // Active theme plug-ins
      this.config.get('path.plugins') // Site plug-ins
    ].forEach(path => Plugin.loadFromDirectory(path));

    log.endActivity(id);
  }

  async readFiles() {
    const id = log.startActivity('Reading files.\t\t\t');

    const configPathSource = this.config.get('path.source');

    // Create an array of patterns that we should ignore when reading the source
    // files of the Yarn site from disk.
    // This primarily includes the '_config.yml' file as well as every path
    // directory that isn't our source path, primarily '_site', '_plugins',
    // and '_themes'.
    let ignorePatterns = values(CONSTANTS.YAML).concat(
      values(this.config.get('path')).filter(path => path !== configPathSource)
    );

    // Ignore package.json file as well.
    ignorePatterns.push('package.json');

    // Ignore StaticCollection paths as those are not processed at all.
    each(this.collections, collection => {
      if (collection.static) {
        ignorePatterns.push(collection.path);
      }
    });

    // Read all files from disk and get their file paths.
    let files = await Promise.fromCallback(cb => {
      glob(configPathSource + '/**/*', {
        // Do not match directories, only files.
        nodir: true,
        // Array of glob patterns to exclude from matching.
        ignore: ignorePatterns.map(path => `**/${path}/**`).concat(
          `${configPathSource}/node_modules/**`
        ),
        // Follow symlinks.
        follow: true
      }, cb);
    });

    files.forEach(filePath => {
      let sourceFile = new File(filePath, this.getConfig);
      this.files[sourceFile.id] = sourceFile;
    });

    // Populate every collection with its files.
    each(this.collections, collection => {
      collection.populate(this.files, this.collections);

      // Add collection data to our global data object.
      this.data.collections[collection.name] = collection.data;
    });

    log.endActivity(id);

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
    const id = log.startActivity('Reading theme files.\t\t');
    try {
      promise = await this.theme.read();
    } catch (e) {
      log.error(e);
    }
    log.endActivity(id);

    // Expose theme data globally.
    this.data.theme = this.theme.data;

    return promise;
  }

  async loadState() {
    await this.readTheme();

    this.loadPlugins();

    await this.readFiles();
  }

  /**
   * Removes configured destination directory and all files contained.
   * @return {Promise} Promise object.
   */
  async cleanDestination() {
    let promise;

    const id = log.startActivity('Cleaning destination.\t\t');
    try {
      promise = await Promise.fromCallback(cb => {
        rimraf(this.config.get('path.destination'), cb);
      });
    } catch (e) {
      log.error(e);
    }

    log.endActivity(id);

    return promise;
  }

  /**
   * Writes Theme files and assets to file system.
   * @return {Promise} Promise object.
   */
  async writeThemeFiles() {
    let promise;

    // Write theme static files.
    const id = log.startActivity('Writing theme files.\t\t');
    try {
      promise = await this.theme.write();
    } catch (e) {
      log.error(e);
    }
    log.endActivity(id);

    return promise;
  }

  /**
   * Builds the yarn site in its entirety.
   * @return {Promise} Promise of when we're done building.
   */
  async build() {
    let promise;

    if (this.config.get('clean_destination')) {
      promise = await this.cleanDestination();
    }

    this.data.yarn = Yarn.getYarnData();

    await this.writeThemeFiles();

    let fileActivityId = log.startActivity('Writing files.\t\t\t');
    let filePromises;
    try {
      filePromises = reduce(this.files, (result, file) => {
        return result.concat(file.write(this.data));
      }, []);

      promise = await Promise.all(filePromises);
    } catch (e) {
      log.error(e.stack);
    }
    log.endActivity(fileActivityId);

    let collectionActivityId = log.startActivity('Writing collection pages.\t');
    try {
      promise = await Promise.all(map(this.collections, collection => {
        return collection.write(this.data);
      }));
    } catch (e) {
      log.error(e.stack);
    }
    log.endActivity(collectionActivityId);

    return promise;
  }

  /**
   * Get information about the Yarn installation from its package.json.
   * @return {Object}
   */
  static getYarnData() {
    let packageJson = {};
    try {
      packageJson = require(Url.pathFromRoot('./package.json'));
    } catch (e) { /* swallow */ }

    return {
      version: packageJson.version,
      time: moment((new Date()).getTime()).format()
    };
  }
}
