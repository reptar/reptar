const fs = require('fs-extra');
const logger = require('winston');
const values = require('lodash/object/values');
const map = require('lodash/collection/map');
const CONSTANTS = require('./constants');
const config = require('./config');
const utils = require('./utils');
const glob = require('glob');
const Collection = require('./collection');
const File = require('./file');


class Yarn {
  constructor() {
    // Subscribe to when config is updated.
    config.on(config.EVENTS.CONFIG_UPDATED, this.configUpdated.bind(this));

    // Kick off leading config update.
    this.configUpdated();
  }

  configUpdated() {
    // Configure template engine.
    utils.template.configure([
      config.theme.path.layouts,
      config.theme.path.includes
    ]);

    // Configure markdown engine.
    utils.markdown.configure(config.remarkable);

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

    this.files = files.reduce((filteredFiles, file) => {
      if (this.isSourceFile(file)) {
        let sourceFile = new File(file);
        filteredFiles[sourceFile.id] = sourceFile;
      }

      return filteredFiles;
    }, {});
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
    .concat(['/_posts/2010','/_posts/2011',
    '/_posts/2012','/_posts/2013','/_posts/2014'])
    // If the filePath includes any of our black-listed contents then it is
    // not a source file. So if some() returns true then it's a black-list file,
    // so we compare the result against false.
    .some(configPath => filePath.includes(configPath)) === false;
  }

  writeFiles() {
    this.collections.forEach(collection => {
      collection.populate(this.files).write();
    });
  }
}

module.exports = Yarn;
