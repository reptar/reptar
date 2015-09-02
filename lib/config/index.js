import path from 'path';
import fs from 'fs';
import {EventEmitter} from 'events';
import logger from 'winston';
import merge from 'lodash/object/merge';
import each from 'lodash/collection/each';
import * as CONSTANTS from '../constants';
import utils from '../utils';

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

    // Merge raw object onto this instance for easy external access.
    merge(this, this._raw);

    // Notify listeners that config has been updated.
    this.emit(EVENTS.CONFIG_UPDATED);
  }

  /**
   * Reads and parses the default config YAML file from package.
   * @return {Object} Parsed default config.
   */
  static defaultConfig() {
    return utils.yaml.parse(
      fs.readFileSync(path.resolve(__dirname, 'defaults.yml'), 'utf8')
    );
  }
}

// Create singleton.
const instance = new Config();

// Export class.
instance.Config = Config;

// Export events object.
instance.EVENTS = EVENTS;

export default instance;
