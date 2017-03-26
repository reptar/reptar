'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _of = require('babel-runtime/core-js/array/of');

var _of2 = _interopRequireDefault(_of);

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _forEach2 = require('lodash/forEach');

var _forEach3 = _interopRequireDefault(_forEach2);

var _flatten2 = require('lodash/flatten');

var _flatten3 = _interopRequireDefault(_flatten2);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _get2 = require('lodash/get');

var _get3 = _interopRequireDefault(_get2);

var _sortBy2 = require('lodash/sortBy');

var _sortBy3 = _interopRequireDefault(_sortBy2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _defaultsDeep2 = require('lodash/defaultsDeep');

var _defaultsDeep3 = _interopRequireDefault(_defaultsDeep2);

var _isFunction2 = require('lodash/isFunction');

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _findUp = require('find-up');

var _findUp2 = _interopRequireDefault(_findUp);

var _resolve = require('resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _constants = require('../constants');

var _constants2 = _interopRequireDefault(_constants);

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

var _configSchema = require('./config-schema');

var _configSchema2 = _interopRequireDefault(_configSchema);

var _less = require('../assets/less');

var _less2 = _interopRequireDefault(_less);

var _sass = require('../assets/sass');

var _sass2 = _interopRequireDefault(_sass);

var _browserify = require('../assets/browserify');

var _browserify2 = _interopRequireDefault(_browserify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const assetProcessors = {
  browserify: _browserify2.default,
  less: _less2.default,
  sass: _sass2.default
};

function requireLocalModule(moduleName) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  let basedir = _ref.basedir;

  const modulePath = _resolve2.default.sync(moduleName, { basedir });
  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(modulePath);
}

/**
 * Look for a {@link Constants.ConfigFilename} file in this directory or any
 * parent directories.
 * @return {string} Path to the local {@link Constants.ConfigFilename} file.
 */
function findLocal() {
  // Look up directories to find our file.
  const configYmlPath = _findUp2.default.sync(_constants2.default.ConfigFilename);

  // If we still can't find our file then throw an error.
  if (!configYmlPath) {
    throw new Error(`No '${_constants2.default.ConfigFilename}' file found.`);
  }

  return configYmlPath;
}

/**
 * Find the directory where our local {@link Constants.ConfigFilename} exists.
 * @return {string} Path to the directory where our
 *   {@link Constants.ConfigFilename} file exists.
 */
function findLocalDir() {
  return findLocal().replace(_constants2.default.ConfigFilename, '');
}

/**
 * Loads the local {@link Constants.ConfigFilename} file.
 * @param {string} root Root path of instance.
 * @return {Object} Config file.
 */
function loadConfigFile(root) {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(_path2.default.join(root, _constants2.default.ConfigFilename));
}

class Config {
  constructor() {
    let root = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : findLocalDir();

    /**
     * Full path to where we're running our app from.
     * @type {string} Full path.
     */
    this.root = root;

    /**
     * Raw object that holds the config object.
     * @type {Object}
     * @private
     */
    this._raw = (0, _create2.default)(null);
  }

  /**
   * Update our in-memory representation of the config file from disk.
   * This load's the YAML file, parses it, validates it, sets defaults,
   * and then updates our internal instance.
   */
  update() {
    // Load Constants.ConfigFilename.
    const loadedConfig = loadConfigFile(this.root);
    const config = (0, _isFunction3.default)(loadedConfig) ? loadedConfig() : loadedConfig;

    // Validate config against schema. Sets defaults where neccessary.

    var _schema$validate = _configSchema2.default.validate(config);

    const error = _schema$validate.error,
          value = _schema$validate.value;


    if (error != null) {
      _log2.default.error(error.annotate());
      throw new Error(`${_constants2.default.ConfigFilename} validation error: ` + `${error.message}`);
    }

    // Store config data privately. Assign all default values.
    this._raw = (0, _defaultsDeep3.default)(value, _configSchema2.default.validate().value);

    // Calculate absolute path of 'paths' keys.
    this._raw.path[_constants2.default.SourceKey] = _path2.default.resolve(this.root, this._raw.path[_constants2.default.SourceKey]);
    (0, _each3.default)(this._raw.path, (val, key) => {
      if (key !== _constants2.default.SourceKey) {
        this._raw.path[key] = _path2.default.resolve(this._raw.path.source, this._raw.path[key]);
      }
    });

    // Sort our default values. They are sorted by:
    //   1. Scopes with only metadata are first.
    //   2. Scopes with paths are sorted from shortest to longest (most
    //      specific).
    //   3. Scopes with both metadata and paths are sorted after.
    //   4. If two objects have the same scope, or if they both have metadata,
    //      then we sort those values in the order in which they were given.
    const sortedDefaults = (0, _sortBy3.default)(this._raw.file.defaults, [defaultObj => (0, _get3.default)(defaultObj, 'scope.path', '').length, defaultObj => defaultObj.scope.metadata != null]);

    // Update each scope path to be absolute relative to source path.
    this._raw.file.defaults = sortedDefaults.map(defaultObj => {
      if (defaultObj.scope.path != null) {
        defaultObj.scope.path = _path2.default.resolve(this._raw.path.source, defaultObj.scope.path);
      }
      return defaultObj;
    });

    // For a given value if it is a string resolve it as if it's an NPM module.
    const resolveMiddlewareModules = moduleVal => {
      if ((0, _isString3.default)(moduleVal)) {
        return requireLocalModule(moduleVal, { basedir: this.root });
      }
      return moduleVal;
    };

    // Make sure all values are arrays.
    const middlewares = (0, _flatten3.default)((0, _of2.default)(this._raw.middlewares));
    this._raw.middlewares = middlewares.map(resolveMiddlewareModules);

    (0, _forEach3.default)(this._raw.lifecycle, (val, key) => {
      const newVal = (0, _flatten3.default)((0, _of2.default)(val));
      this._raw.lifecycle[key] = newVal.map(resolveMiddlewareModules);
    });

    // Convert every config.asset.test value to be a function.
    this._raw.assets = this._raw.assets.map(asset => {
      let testVal = asset.test;

      if ((0, _isString3.default)(testVal)) {
        // A string test value must match from the beginning of the input value.
        testVal = new RegExp(`^${testVal}`);
      }

      if (!(0, _isFunction3.default)(testVal)) {
        const regExp = testVal;
        testVal = filePath => filePath.match(regExp) !== null;
      }

      let useVal = asset.use;
      if ((0, _isString3.default)(useVal)) {
        useVal = assetProcessors[useVal] ? assetProcessors[useVal] : requireLocalModule(useVal, { basedir: this.root });
      }

      return {
        test: testVal,
        use: useVal
      };
    });
  }

  /**
   * Getter to access config properties. Everything is pushed through here
   * so we can provide required defaults if they're not set. Also enforces
   * uniform access to config properties.
   * @param {string} objectPath Path to object property, i.e. 'path.source'.
   * @return {*} Config value.
   */
  get() {
    let objectPath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    const value = (0, _get3.default)(this._raw, objectPath);

    if (value == null) {
      throw new Error(`Tried to access config path "${objectPath}" ` + 'that does not exist.');
    }

    return value;
  }
}
exports.default = Config;