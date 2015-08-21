const glob = require('glob');
const path = require('path');
const fs = require('fs');
const each = require('lodash/collection/each');
const config = require('./config');
const utils = require('./utils');
const CONSTANTS = require('./constants');

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
     * @private
     */
    this.config;
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

    // Save raw theme config.
    this.config = files[0];

    // Calculate absolute path of 'paths' keys.
    each(this.config.path, (val, key) => {
      if (key !== CONSTANTS.KEY.SOURCE) {
        this.config.path[key] = path.resolve(
          this.config.path.source,
          this.config.path[key]
        );
      }
    });
  }
}

// Export class.
module.exports = Theme;
