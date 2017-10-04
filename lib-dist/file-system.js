'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _values2 = require('lodash/values');

var _values3 = _interopRequireDefault(_values2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _constants = require('./constants');

var _constants2 = _interopRequireDefault(_constants);

var _file = require('./file');

var _file2 = _interopRequireDefault(_file);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class FileSystem {
  constructor() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    let config = _ref.config,
        renderer = _ref.renderer;

    /**
     * @type {Config}
     * @private
     */
    this._config = config;

    /**
     * @type {Renderer}
     * @private
     */
    this._renderer = renderer;

    /**
     * All files found in our source path.
     * Key is the full path to the file, value is the actual File object.
     * @type {Object.<string, File>}
     */
    this.files = (0, _create2.default)(null);
  }

  loadIntoMemory() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const configPathSource = _this._config.get('path.source');

      // Create an array of patterns that we should ignore when reading the source
      // files of the Reptar site from disk.
      // This primarily includes the Constants.ConfigFilename file as well as
      // every path directory that isn't our source path.
      const globIgnorePatterns = [_constants2.default.ConfigFilename, 'package.json', 'node_modules'].concat((0, _values3.default)(_this._config.get('path')).filter(function (pathVal) {
        return pathVal !== configPathSource;
      })).map(function (ignorePath) {
        return `**/${ignorePath}/**`;
      });

      // Read all files from disk and get their file paths.
      const files = yield _bluebird2.default.fromCallback(function (cb) {
        (0, _glob2.default)(`${configPathSource}/**/*`, {
          // Do not match directories, only files.
          nodir: true,
          // Array of glob patterns to exclude from matching.
          ignore: globIgnorePatterns,
          // Follow symlinks.
          follow: true
        }, cb);
      });

      const ignorePatterns = _this._config.get('ignore');

      const filePromises = files
      // Filter out files that match our array of ignored patterns.
      .filter(function (rawPath) {
        return (
          // If one of our ignore patterns matches then we filter the file out.
          // This is done by asserting that .some returns false, that none pass.
          ignorePatterns.some(function (ignoreFn) {
            return ignoreFn(rawPath);
          }) === false
        );
      }).map(function (rawPath) {
        // Correct the filePath created by glob to be compatible with Windows.
        // Known issue in node-glob
        // https://github.com/isaacs/node-glob/pull/263.
        const filePath = _path2.default.normalize(rawPath.replace(/\//g, _path2.default.sep));

        const sourceFile = new _file2.default(filePath, {
          config: _this._config,
          renderer: _this._renderer
        });
        _this.files[sourceFile.id] = sourceFile;

        return sourceFile.update();
      });

      return _bluebird2.default.all(filePromises);
    })();
  }
}
exports.default = FileSystem;