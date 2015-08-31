require('winston').cli({
  colorize: true
});

const path = require('path');
const Promise = require('bluebird');
const values = require('lodash/object/values');
const map = require('lodash/collection/map');
const rimraf = Promise.promisify(require('rimraf'));
const logger = require('winston');
const glob = require('glob');
const CONSTANTS = require('./constants');
const config = require('./config');
const utils = require('./utils');
const Plugin = require('./plugin/index');
const Theme = require('./theme');
const Collection = require('./collection');
const File = require('./file');

class Yarn {
  constructor() {
    /**
     * Site wide data available in all templates.
     * @type {Object.<string, Object>}
     */
    this.data = {};

    /**
     * All files found in our source path.
     * @type {Object.<string, File>}
     */
    this.files = {};

    /**
     * Class responsible for handling themes.
     * @type {Theme}
     */
    this.theme = new Theme();

    // Subscribe to when config is updated.
    config.on(config.EVENTS.CONFIG_UPDATED, this.configUpdated.bind(this));

    // Kick off leading config update.
    this.configUpdated();
  }

  configUpdated() {
    this.theme.update();

    // Configure template engine.
    utils.template.configure([
      this.theme.config.path.templates
    ]);

    // Configure markdown engine.
    utils.markdown.configure(config.remarkable);

    /**
     * Expose site data from config file.
     * @type {Object}
     */
    this.data.site = config.site;

    /**
     * Array of Collection instances.
     * @type {Array.<Collection>}
     */
    this.collections = map(config.collections,
      (collectionConfig, collectionName) => {
        return new Collection(collectionName, collectionConfig);
      }
    );

    // Collect all collection paths.
    let allCollectionPaths = this.collections.reduce((allPaths, collection) => {
      // Only include a collection path if it exists and isn't the app source.
      if (collection.path && collection.path !== config.path.source) {
        allPaths.push(collection.path);
      }

      return allPaths;
    }, []);

    // Set exclude paths one every collection.
    this.collections.forEach(collection => {
      // Make copy of array so it's not modified by each collection.
      collection.setExcludePaths(Array.from(allCollectionPaths));
    });
  }

  async readFiles() {
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

    this.collections.forEach(collection => {
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

    files.map(file => {
      let sourceFile = new File(file);
      this.files[sourceFile.id] = sourceFile;
    });

    /**
     * Expose collections.
     * @type {Object}
     */
    this.data.collections = {};

    // Populate every collection with its files.
    this.collections.forEach(collection => {
      collection.populate(this.files);

      // Add collection data to our global data object.
      this.data.collections[collection.name] = collection.data;
    });

    logger.info('\tdone!');

    return Promise.resolve();
  }

  async writeFiles() {
    if (config.clean_destination) {
      logger.info('Cleaning destination %s', config.path.destination);
      await rimraf(config.path.destination);
      logger.info('\tdone!');
    }

    // Write theme static files.
    logger.info('Writing theme files...');
    await this.theme.write();
    logger.info('\tdone!');

    // Expose theme data globally.
    this.data.theme = this.theme.data;

    logger.info('Writing files...');
    try {
      await Promise.all(this.collections.map(collection => {
        return collection.write(this.data);
      }));
    } catch (e) {
      logger.error(e);
    }
    logger.info('\tdone!');
  }
}

module.exports = Yarn;
