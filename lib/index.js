const Promise = require('bluebird');
const values = require('lodash/object/values');
const map = require('lodash/collection/map');
const rimraf = require('rimraf');
const logger = require('winston');
const glob = require('glob');
const CONSTANTS = require('./constants');
const config = require('./config');
const utils = require('./utils');
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

    utils.template.defaultFilters.forEach(filter => {
      utils.template.addFilter.apply(null, filter);
    });

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

  readFiles() {
    let files = glob.sync(config.path.source + '/**/*', {
      nodir: true
    });

    if (!files.length) {
      return;
    }

    /**
     * All files found in our source path.
     * @type {Object.<string, File>}
     */
    this.files = files.reduce((filteredFiles, file) => {
      if (this.isSourceFile(file)) {
        let sourceFile = new File(file);
        filteredFiles[sourceFile.id] = sourceFile;
      }

      return filteredFiles;
    }, {});

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
  }

  /**
   * Checks if a given file path is a source file via checking a black-list of
   * file names and directories that it cannot be.
   * @param {string} filePath A given file path.
   * @return {boolean} true if the file is a source file and should be included.
   */
  isSourceFile(filePath = '') {
    // Construct an array of file names and directories.
    return values(CONSTANTS.YAML).concat(
      // Don't include the path.source as that'll exclude all files.
      values(config.path).filter(path => path !== config.path.source)
    )
    // If the filePath includes any of our black-listed contents then it is
    // not a source file. So if some() returns true then it's a black-list file,
    // so we compare the result against false.
    .some(configPath => filePath.includes(configPath)) === false;
  }

  async writeFiles() {
    if (config.clean_destination) {
      logger.info('Cleaning destination %s', config.path.destination);
      rimraf.sync(config.path.destination);
    }

    // Write theme static files.
    await this.theme.write();

    // Expose theme data globally.
    this.data.theme = this.theme.data;

    await Promise.all(this.collections.map(collection => {
      return collection.write(this.data);
    }));

    logger.info('Done writing.');
  }
}

module.exports = Yarn;
