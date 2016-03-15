import path from 'path';
import fs from 'fs';
import {EventEmitter} from 'events';
import findUp from 'find-up';
import merge from 'lodash/merge';
import isUndefined from 'lodash/isUndefined';
import getObjectValue from 'lodash/get';
import each from 'lodash/each';
import * as CONSTANTS from '../constants';
import Parse from '../parse';

/**
 * Object of event names assigned to an object for easy reference.
 * @type {Object.<string, string>}
 * @const
 */
export const EVENTS = {
  CONFIG_UPDATED: 'CONFIG_UPDATED'
};

export default class Config extends EventEmitter {
  constructor() {
    super();

    /**
     * Full path to where we're running our app from.
     * @type {string} Full path.
     * @private
     */
    this._root;

    /**
     * Raw object that holds the config object.
     * @type {Object}
     * @private
     */
    this._raw = Object.create(null);

    /**
     * Default values for configuration properties that must exist.
     * @type {Object}
     * @private
     */
    this._defaults;
  }

  /**
   * Look for a `_config.yml` file in this directory or any parent directories.
   * @return {string} Path to the local `_config.yml` file.
   */
  findLocal() {
    // Look up directories to find a '_config.yml' file.
    let configYmlPath = findUp.sync(CONSTANTS.YAML.CONFIG);

    // If we still can't find a '_config.yml' file then throw an error.
    if (!configYmlPath) {
      throw new Error(`No '${CONSTANTS.YAML.CONFIG}' file found.`);
    }

    return configYmlPath;
  }

  /**
   * Find the directory where our local '_config.yml' exists.
   * @return {string} Path to the directory where our '_config.yml' file exists.
   */
  findLocalDir() {
    return this.findLocal().replace(CONSTANTS.YAML.CONFIG, '');
  }

  /**
   * Set the root path of where we're executing from. If it's different than
   * our previous stored value then we re-load the local config.
   * @param {string} rootPath Absoute path.
   */
  setRoot(rootPath) {
    const oldPath = this._root;

    // Update new root.
    this._root = rootPath;

    if (oldPath !== this._root) {
      this.loadLocal();
    }
  }

  loadLocal() {
    let localConfigPath = path.join(this._root, CONSTANTS.YAML.CONFIG);
    let localConfig = '';
    try {
      localConfig = fs.readFileSync(localConfigPath, 'utf8');
    } catch (e) {
      // noop.
    }

    let newConfig = Parse.fromYaml(localConfig);

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

    // Notify listeners that config has been updated.
    this.emit(EVENTS.CONFIG_UPDATED);
  }

  /**
   * Getter to access config properties. Everything is pushed through here
   * so we can provide required defaults if they're not set. Also enforces
   * uniform access to config properties.
   * @param {string} objectPath Path to object property, i.e. 'path.source'.
   * @return {*} Config value.
   */
  get(objectPath = '') {
    let value = getObjectValue(this._raw, objectPath);

    if (isUndefined(value)) {
      value = getObjectValue(this._defaults, objectPath);

      if (isUndefined(value)) {
        throw new Error('Tried to access config option that does not exist.');
      }
    }

    return value;
  }

  /**
   * Reads and parses the default config YAML file from package.
   * @return {Object} Parsed default config.
   */
  static defaultConfig() {
    return Parse.fromYaml(
      fs.readFileSync(path.resolve(__dirname, 'defaults.yml'), 'utf8')
    );
  }

  /**
   * Helper function that creates a new Config instance with the '_config.yml'
   * file already loaded.
   * @param {string} root Optional give a root path.
   * @return {Config} Config instance.
   */
  static create(root) {
    let config = new Config();
    config.setRoot(root || config.findLocalDir());
    return config;
  }
}
