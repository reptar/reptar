const path = require('path');
const fs = require('fs');
const {EventEmitter} = require('events');
const logger = require('winston');
const CONSTANTS = require('./constants');
const utils = require('./utils');
const Theme = require('./theme');
const merge = require('lodash/object/merge');
const each = require('lodash/collection/each');

/**
 * Object of event names assigned to an object for easy reference.
 * @type {Object.<string, string>}
 * @const
 */
const EVENTS = {
  CONFIG_UPDATED: 'CONFIG_UPDATED'
};

class Config extends EventEmitter {
  constructor() {
    super();

    /**
     * Full path to where we're running our app from.
     * @type {string} Full path.
     * @private
     */
    this._root = path.resolve(process.cwd());

    /**
     * Raw object that holds the config object.
     * @type {Object}
     * @private
     */
    this._raw = Object.create(null);

    /**
     * Class responsible for handling themes.
     * @type {Theme}
     * @private
     */
    this._theme = new Theme();

    this.loadLocal();
  }

  loadLocal() {
    let localConfigPath = path.join(this._root, CONSTANTS.YAML.CONFIG);
    let localConfig = '';
    try {
      localConfig = fs.readFileSync(localConfigPath, 'utf8');
    } catch (e) {
      logger.warn('Unable to load local config.yml file.');
    }

    let newConfig = utils.yaml.parse(localConfig);

    this.update(newConfig);
  }

  update(config = {}) {
    // Store config data privately.
    merge(this._raw, Config.defaultConfig(), config);

    // Calculate absolute path of 'paths' keys.
    this._raw.path[CONSTANTS.KEY.SOURCE] = path.resolve(
      this._root, this._raw.path[CONSTANTS.KEY.SOURCE]
    );
    each(this._raw.path, (val, key) => {
      if (key !== CONSTANTS.KEY.SOURCE) {
        this._raw.path[key] = path.resolve(
          this._raw.path.source,
          this._raw.path[key]
        );
      }
    });

    // Update theme.
    this._theme.update(this._raw);

    // Merge raw object onto this instance for easy external access.
    merge(this, this._raw);

    // Notify listeners that config has been updated.
    this.emit(EVENTS.CONFIG_UPDATED);
  }

  /**
   * Return our internal Theme instance instead of config property.
   * @return {Theme}
   */
  get theme() {
    return this._theme;
  }

  /**
   * Reads and parses the default config YAML file from package.
   * @return {Object} Parsed default config.
   */
  static defaultConfig() {
    return utils.yaml.parse(
      fs.readFileSync(path.resolve(__dirname, 'config_defaults.yml'), 'utf8')
    );
  }
}

// Create singleton.
module.exports = new Config();

// Export class.
module.exports.Config = Config;

// Export events object.
module.exports.EVENTS = EVENTS;
