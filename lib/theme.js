const glob = require('glob');
const path = require('path');
const fs = require('fs');
const utils = require('./utils');
const CONSTANTS = require('./constants');
const merge = require('lodash/object/merge');
const each = require('lodash/collection/each');

class Theme {
  constructor() {
    /**
     * Raw object that holds the config object.
     * @type {Object}
     * @private
     */
    this._raw = Object.create(null);

    /**
     * The current theme name.
     * @type {string}
     */
    this.name = '';
  }

  update(config = {}) {
    this.name = config.theme;

    let files = glob.sync(config.path.themes + `/**/${CONSTANTS.YAML.THEME}`, {
      nodir: true
    }).reduce((allFiles, file) => {
      let parsedFile = utils.yaml.parse(
        fs.readFileSync(file, 'utf8')
      );

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
    this._raw = files[0];

    // Calculate absolute path of 'paths' keys.
    each(this._raw.path, (val, key) => {
      if (key !== CONSTANTS.KEY.SOURCE) {
        this._raw.path[key] = path.resolve(
          this._raw.path.source,
          this._raw.path[key]
        );
      }
    });

    // Merge raw object onto this instance for easy external access.
    merge(this, this._raw);
  }
}

// Export class.
module.exports = Theme;
