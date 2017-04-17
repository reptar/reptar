'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readDataFiles = undefined;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _set2 = require('lodash/set');

var _set3 = _interopRequireDefault(_set2);

/**
 * Load all files in the given dataPath file and parse them into a JS object.
 * Then depending on the directory path structure and the name of the file
 * set the files contents in that path on an object.
 * @param {string} dataPath Path to data files.
 * @return {Object}
 */
let readDataFiles = exports.readDataFiles = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* () {
    let dataPath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    // Read all files from disk and get their file paths.
    const filePaths = yield _bluebird2.default.fromCallback(function (cb) {
      (0, _glob2.default)(`${dataPath}/**/*.{json,yml,yaml}`, {
        // Do not match directories, only files.
        nodir: true,
        // Follow symlinks.
        follow: true
      }, cb);
    }).map(function (filePath) {
      return (
        // Correct the filePath created by glob to be compatible with Windows.
        // Known issue in node-glob https://github.com/isaacs/node-glob/pull/263.
        // eslint-disable-next-line no-useless-escape
        _path2.default.normalize(filePath.replace(/[\\\/]/g, _path2.default.sep))
      );
    });

    const files = filePaths.map(function (filePath) {
      return {
        filePath,
        // Load and parse file's contents.
        content: _parse2.default.smartLoadAndParse(filePath),
        // Create the path where we'll set the file's contents.
        // This turns something like
        // /Users/user/reptar/_data/friends/angelica.json
        // into
        // ['friends', 'angelica']
        // So we can use it with _.set.
        dataPath: _path2.default.relative(dataPath, _path2.default.join(_path2.default.dirname(filePath), _path2.default.basename(filePath, _path2.default.extname(filePath)))).split(_path2.default.sep)
      };
    });

    return files.reduce(function (acc, file) {
      return (
        // Set file's contents on the corresponding path.
        (0, _set3.default)(acc, file.dataPath, file.content)
      );
    }, {});
  });

  return function readDataFiles() {
    return _ref.apply(this, arguments);
  };
})();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _parse = require('./parse');

var _parse2 = _interopRequireDefault(_parse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (() => {
  var _ref2 = (0, _asyncToGenerator3.default)(function* (reptar) {
    // Read data files.
    const dataFiles = yield readDataFiles(reptar.config.get('path.data'));

    // Expose it on the site object.
    reptar.metadata.set('site.data', dataFiles);
  });

  function addDataFiles(_x2) {
    return _ref2.apply(this, arguments);
  }

  return addDataFiles;
})();