import path from 'path';
import fs from 'fs';
import findUp from 'find-up';
import _ from 'lodash';
import * as CONSTANTS from '../constants';
import log from '../log';
import Parse from '../parse';
import schema from './config-schema';

/**
 * Look for a `_config.yml` file in this directory or any parent directories.
 * @return {string} Path to the local `_config.yml` file.
 */
function findLocal() {
  // Look up directories to find a '_config.yml' file.
  const configYmlPath = findUp.sync(CONSTANTS.YAML.CONFIG);

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
function findLocalDir() {
  return findLocal().replace(CONSTANTS.YAML.CONFIG, '');
}

/**
 * Loads the local `_config.yml` file into memory and parses it.
 * @param {string} root Root path of instance.
 * @return {Object} Parsed YAML file as a JavaScript object.
 */
function loadAndParseYaml(root) {
  const localConfigPath = path.join(root, CONSTANTS.YAML.CONFIG);
  let localConfig = '';
  try {
    localConfig = fs.readFileSync(localConfigPath, 'utf8');
  } catch (e) {
    // noop.
  }

  return Parse.fromYaml(localConfig);
}

export default class Config {
  constructor() {
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
  }

  /**
   * Getter to return root path of where we're executing from.
   * @return {string}
   */
  get root() {
    return this._root;
  }

  /**
   * Setter of the root path of where we're executing from. If it's different
   * than our previous stored value then we re-load the local config.
   * @param {string} rootPath Absoute path.
   */
  set root(rootPath) {
    const oldPath = this._root;

    // Update new root.
    this._root = rootPath;

    if (oldPath !== this._root) {
      this.update();
    }
  }

  /**
   * Update our in-memory representation of the config file from disk.
   * This load's the YAML file, parses it, validates it, sets defaults,
   * and then updates our internal instance.
   */
  update() {
    // Load and parse YAML file into JS object.
    const config = loadAndParseYaml(this._root);

    // Validate config against schema. Sets defaults where neccessary.
    const { error, value } = schema.validate(config);

    if (error != null) {
      log.error(error.annotate());
      throw new Error(`_config.yml validation error: ${error.message}`);
    }

    // Store config data privately. Assign all default values.
    this._raw = _.defaultsDeep(
      value,
      schema.validate().value
    );

    // Calculate absolute path of 'paths' keys.
    this._raw.path[CONSTANTS.KEY.SOURCE] = path.resolve(
      this._root, this._raw.path[CONSTANTS.KEY.SOURCE]
    );
    _.each(this._raw.path, (val, key) => {
      if (key !== CONSTANTS.KEY.SOURCE) {
        this._raw.path[key] = path.resolve(
          this._raw.path.source,
          this._raw.path[key]
        );
      }
    });

    // Sort our default values. They are sorted by:
    //   1. Scopes with only metadata are first.
    //   2. Scopes with paths are sorted from shortest to longest (most
    //      specific).
    //   3. Scopes with both metadata and paths are sorted after.
    //   4. If two objects have the same scope, or if they both have metadata,
    //      then we sort those values in the order in which they were given.
    const sortedDefaults = _.sortBy(this._raw.file.defaults, [
      defaultObj => _.get(defaultObj, 'scope.path', '').length,
      defaultObj => defaultObj.scope.metadata != null,
    ]);

    // Update each scope path to be absolute relative to source path.
    this._raw.file.defaults = sortedDefaults.map(defaultObj => {
      if (defaultObj.scope.path != null) {
        defaultObj.scope.path = path.resolve(
          this._raw.path.source,
          defaultObj.scope.path,
        );
      }
      return defaultObj;
    });
  }

  /**
   * Getter to access config properties. Everything is pushed through here
   * so we can provide required defaults if they're not set. Also enforces
   * uniform access to config properties.
   * @param {string} objectPath Path to object property, i.e. 'path.source'.
   * @return {*} Config value.
   */
  get(objectPath = '') {
    const value = _.get(this._raw, objectPath);

    if (value == null) {
      throw new Error(`Tried to access config '${objectPath}' ` +
        'that does not exist.');
    }

    return value;
  }

  /**
   * Reads and parses the example config YAML file from package.
   * @return {Object} Parsed default config.
   */
  static exampleConfig() {
    return Parse.fromYaml(
      fs.readFileSync(path.resolve(__dirname, 'config_example.yml'), 'utf8')
    );
  }

  /**
   * Helper function that creates a new Config instance with the '_config.yml'
   * file already loaded.
   * @param {string?} root Optional give a root path.
   * @return {Config} Config instance.
   */
  static create(root) {
    const config = new Config();
    config.root = root != null ? root : findLocalDir();
    return config;
  }
}
