'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _forEach2 = require('lodash/forEach');

var _forEach3 = _interopRequireDefault(_forEach2);

var _isNil2 = require('lodash/isNil');

var _isNil3 = _interopRequireDefault(_isNil2);

var _defaults2 = require('lodash/defaults');

var _defaults3 = _interopRequireDefault(_defaults2);

/**
 * Helper function to wrap commands with a log.startActivity command so we can
 * see how long a command takes.
 * @param {string} label A label to use for this command.
 * @param {Function} cmd A function to run as the command.
 */
let wrapCommand = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (label, cmd) {
    const startTime = Date.now();
    const spinner = (0, _ora2.default)({
      text: label,
      spinner: 'dot4'
    }).start();

    try {
      yield cmd();
      spinner.text = `${label} (${Date.now() - startTime}ms)`;
      spinner.succeed();
    } catch (e) {
      spinner.fail();
      throw e;
    }
  });

  return function wrapCommand(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

/**
 * Process middleware functions.
 * @param {Array.<function>} options.middlewares Middleware functions.
 * @param {Reptar} options.reptar Reptar instance.
 * @return {Promise} Returns a Promise.
 */


var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _ora = require('ora');

var _ora2 = _interopRequireDefault(_ora);

var _ware = require('ware');

var _ware2 = _interopRequireDefault(_ware);

var _cache = require('./cache');

var _cache2 = _interopRequireDefault(_cache);

var _checksum = require('./checksum');

var _checksum2 = _interopRequireDefault(_checksum);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _fileSystem = require('./file-system');

var _fileSystem2 = _interopRequireDefault(_fileSystem);

var _url = require('./url');

var _url2 = _interopRequireDefault(_url);

var _metadata = require('./metadata');

var _metadata2 = _interopRequireDefault(_metadata);

var _renderer = require('./renderer');

var _renderer2 = _interopRequireDefault(_renderer);

var _collection = require('./collection');

var _collection2 = _interopRequireDefault(_collection);

var _dataFiles = require('./data-files');

var _dataFiles2 = _interopRequireDefault(_dataFiles);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function processMiddlewares(_ref2) {
  let middlewares = _ref2.middlewares,
      reptar = _ref2.reptar;

  return new _bluebird2.default((resolve, reject) => {
    (0, _ware2.default)(middlewares).run(reptar, err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

class Reptar {
  /**
   * Create a new Reptar instance.
   * @param {Object} options Options object.
   * @param {string} options.rootPath Where the root path of this Reptar
   *   instance points to.
   * @param {boolean} options.incremental If we should incremental build files.
   * @param {boolean} options.noTemplateCache Should templates be cached.
   *   Typically this is only off when developing or in watch mode.
   */
  constructor() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    /**
     * Save options passed into instance.
     * @type {Object}
     */
    this.options = (0, _defaults3.default)(options, {
      noTemplateCache: false,
      clean: false,
      incremental: undefined,
      rootPath: undefined,
      showSpinner: true
    });

    this._wrapCommand = this.options.showSpinner ? wrapCommand : (label, fn) => fn();

    /**
     * Expose config object on instance.
     * @type {Config}
     */
    this.config = new _config2.default(this.options.rootPath);

    /**
     * @type {Renderer}
     */
    this.renderer = new _renderer2.default({
      config: this.config
    });

    /**
     * Create backing FileSystem instance.
     * @type {FileSystem}
     */
    this.fileSystem = new _fileSystem2.default({
      config: this.config,
      renderer: this.renderer
    });

    /**
     * Create metadata that will be accessible within every template.
     * @type {Metadata}
     */
    this.metadata = new _metadata2.default();

    /**
     * Our destination object of where our files will be written.
     * @type {Object.<string, File>}
     */
    this.destination = (0, _create2.default)(null);
  }

  update() {
    var _this = this,
        _arguments = arguments;

    return (0, _asyncToGenerator3.default)(function* () {
      var _ref3 = _arguments.length > 0 && _arguments[0] !== undefined ? _arguments[0] : {},
          _ref3$skipFiles = _ref3.skipFiles;

      let skipFiles = _ref3$skipFiles === undefined ? false : _ref3$skipFiles;

      _this.config.update();

      yield _this._processMiddlewares({
        middlewaresKey: 'lifecycle.willUpdate'
      });

      var _path$parse = _path2.default.parse(_this.config.root);

      const base = _path$parse.base,
            dir = _path$parse.dir;

      _cache2.default.setNamespace(`${base}-${(0, _checksum2.default)(dir).slice(0, 10)}`);

      // Options passed into constructor take precedence over the config value.
      // We default to loading cache, unless explicitly set to false.
      const shouldLoadCache = !(0, _isNil3.default)(_this.options.incremental) ? _this.options.incremental !== false : _this.config.get('incremental') !== false;
      if (shouldLoadCache) {
        _cache2.default.load();
      }

      _url2.default.setSlugOptions(_this.config.get('slug'));

      _this.renderer.update({
        noTemplateCache: _this.options.noTemplateCache
      });

      // Expose site data from config file.
      _this.metadata.set('site', _this.config.get('site'));

      if (!skipFiles) {
        yield _this._wrapCommand('Reading files.\t\t\t', _this.fileSystem.loadIntoMemory.bind(_this.fileSystem));
      }

      (0, _forEach3.default)(_this.fileSystem.files, function (file) {
        _this.destination[file.destination] = file;
      });

      _this.metadata.set('reptar', Reptar.getReptarData());

      (0, _collection2.default)(_this);
      (0, _dataFiles2.default)(_this);

      yield _this._processMiddlewares({
        middlewaresKey: 'lifecycle.didUpdate'
      });

      yield _this._processMiddlewares({
        middlewaresKey: 'middlewares'
      });
    })();
  }

  /**
   * Removes configured destination directory and all files contained.
   * @return {Promise} Promise object.
   */
  cleanDestination() {
    var _this2 = this;

    return this._wrapCommand('Cleaning destination.\t\t\t', (0, _asyncToGenerator3.default)(function* () {
      yield _bluebird2.default.fromCallback(function (cb) {
        (0, _rimraf2.default)(_this2.config.get('path.destination'), cb);
      });

      // Clear cache.
      _cache2.default.clear();
    }));
  }

  /**
   * Builds the Reptar site in its entirety.
   */
  build() {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      yield _this3._processMiddlewares({
        middlewaresKey: 'lifecycle.willBuild'
      });

      if (_this3.config.get('cleanDestination') || _this3.options.clean) {
        yield _this3.cleanDestination();
      }

      const metadata = _this3.metadata.get();

      yield _this3._wrapCommand('Writing destination.\t\t\t', function () {
        return _bluebird2.default.all((0, _map3.default)(_this3.destination, function (file) {
          return file.write(metadata);
        }));
      });

      yield _this3._processMiddlewares({
        middlewaresKey: 'lifecycle.didBuild'
      });
    })();
  }

  _processMiddlewares(_ref5) {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      let middlewaresKey = _ref5.middlewaresKey;

      const middlewares = _this4.config.get(middlewaresKey);

      if (middlewares.length === 0) {
        return;
      }

      const tabs = middlewaresKey.length > 11 ? '\t\t' : '\t\t';

      yield _this4._wrapCommand(`Running "${middlewaresKey}".${tabs}`, function () {
        return processMiddlewares({ middlewares, reptar: _this4 });
      });
    })();
  }

  /**
   * Get information about the Reptar installation from its package.json.
   * @return {Object}
   */
  static getReptarData() {
    let packageJson = {};
    try {
      // eslint-disable-next-line
      packageJson = require(_url2.default.pathFromRoot('./package.json'));
    } catch (e) {/* ignore */}

    return {
      version: packageJson.version,
      time: (0, _moment2.default)(new Date().getTime()).format()
    };
  }
}
exports.default = Reptar;