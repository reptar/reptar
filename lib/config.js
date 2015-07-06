const path = require('path');
const fs = require('fs');
const utils = require('./utils');
const merge = require('lodash/object/merge');

/**
 * Array of path keys from the YAML file we need to resolve to absolute paths.
 * @type {Array.<string>}
 */
const PATH_KEYS_TO_RESOLVE = [
  'destination',
  'posts',
  'plugins',
  'data_source'
];

/**
 * Array of theme keys from the YAML file we need to resolve to absolute paths.
 * @type {Array.<string>}
 */
const THEME_KEYS_TO_RESOLVE = [
  'layouts',
  'includes',
  'css',
  'js'
];

class Config {
  constructor() {
    /**
     * Full path to where we're running our app from.
     * @type {string} Full path.
     * @private
     */
    this._root = path.resolve(process.cwd());
  }

  update(config = {}) {
    // Store config data on this.
    merge(this, Config.defaultConfig(), config);

    // Calculate absolute path of 'paths' keys.
    this.path.source = path.resolve(this._root, this.path.source);
    PATH_KEYS_TO_RESOLVE.forEach(pathKey => {
      this.path[pathKey] = path.resolve(this.path.source, this.path[pathKey]);
    });

    // Calculate absolute path of 'theme' keys.
    this.theme.source = path.resolve(this.path.source, this.theme.source);
    THEME_KEYS_TO_RESOLVE.forEach(themeKey => {
      this.theme[themeKey] = path.resolve(
        this.theme.source,
        this.theme[themeKey]
      );
    });

    // Configure template engine.
    utils.template.configure([
      this.theme.layouts,
      this.theme.includes
    ]);

    // Configure markdown engine.
    utils.markdown.configure(this.remarkable);
  }

  static defaultConfig() {
    return utils.yaml.parse(
      fs.readFileSync(path.resolve(__dirname, 'config_defaults.yml'), 'utf8')
    );
  }
}

module.exports = Config;
