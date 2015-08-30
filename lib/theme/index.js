const glob = require('glob');
const path = require('path');
const fs = require('fs-extra');
const each = require('lodash/collection/each');
const config = require('../config');
const utils = require('../utils');
const CONSTANTS = require('../constants');
const Asset = require('./asset');

class Theme {
  constructor() {
    /**
     * The current theme name.
     * @type {string}
     */
    this.name = '';

    /**
     * Raw object that holds the theme config object.
     * @type {Object}
     */
    this.config;

    /**
     * Collection of all assets for this theme.
     * @type {Array.<Asset>}
     */
    this.assets = [];

    /**
     * Data of asset names and paths that is exposed to templates.
     * @type {Object}
     */
    this.data = {};
  }

  update() {
    this.name = config.theme;

    // Find all theme config files that might exist.
    let files = glob.sync(config.path.themes + `/**/${CONSTANTS.YAML.THEME}`, {
      nodir: true
    }).reduce((allFiles, file) => {
      let parsedFile = utils.yaml.parse(
        fs.readFileSync(file, 'utf8')
      );

      // If the found theme config file name matches our set theme name
      // then save it.
      if (parsedFile.name === this.name) {
        // Save the directory where the correct theme file was found.
        parsedFile.path[CONSTANTS.KEY.SOURCE] = path.dirname(file);
        allFiles.push(parsedFile);
      }

      return allFiles;
    }, []);

    if (files.length !== 1) {
      throw new Error('Found multiple themes with the same name.');
    }

    let parsedFile = files[0];

    // Save raw theme config.
    this.config = parsedFile;

    // Calculate absolute path of 'paths' keys.
    each(this.config.path, (val, key) => {
      if (key !== CONSTANTS.KEY.SOURCE) {
        // The root of the theme's destination is the site's destination.
        let rootPath = key === CONSTANTS.KEY.DESTINATION ?
          config.path.destination : this.config.path.source;

        this.config.path[key] = path.resolve(
          rootPath,
          this.config.path[key]
        );
      }
    });
  }

  async write() {
    // Instantiate an Asset for every asset the theme configures.
    each(this.config.assets, (assetConfig, assetType) => {
      assetConfig.destination = path.resolve(
        this.config.path.destination,
        assetConfig.source
      );

      assetConfig.source = path.resolve(
        this.config.path.source,
        assetConfig.source
      );

      this.assets.push(new Asset(assetType, assetConfig));
    });

    // Have every asset write itself to the destination folder.
    await Promise.all(
      this.assets.map(assetProcessor => {
        return assetProcessor.write();
      })
    );

    // Expose every asset's data onto the theme's data object.
    this.assets.forEach(assetProcessor => {
      if (assetProcessor.data) {
        this.data[assetProcessor.type] = assetProcessor.data.url;
      }
    });
  }
}


// Export class.
module.exports = Theme;
