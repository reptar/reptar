'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _homeOrTmp = require('home-or-tmp');

var _homeOrTmp2 = _interopRequireDefault(_homeOrTmp);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let data = {};

/**
 * Namespace of the Reptar site that we're caching. This is unique for every
 * directory so we can manage cache individually for each local Reptar install.
 * @param {string}
 */
let namespace;

function createFilename() {
  let name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  return _path2.default.join(_homeOrTmp2.default, '.reptar-cache', `${name}.json`);
}

let filename = createFilename(namespace);

const cache = {
  setNamespace(val) {
    namespace = val;

    filename = createFilename(namespace);
  },

  load() {
    if (this._loaded) {
      return;
    }
    this._loaded = true;

    process.on('exit', cache.save);

    try {
      data = JSON.parse(_fsExtra2.default.readFileSync(filename));
    } catch (err) {}
  },

  save() {
    let content = {};

    // Add information about the namespace for this cache so it's
    // human readable.
    data['_namespace'] = namespace;

    try {
      content = (0, _stringify2.default)(data, null, '  ');
    } catch (err) {
      if (err.message === 'Invalid string length') {
        err.message = 'Cache too large so it\'s been cleared.';
        _log2.default.error(err.stack);
      } else {
        throw err;
      }
    }

    _fsExtra2.default.outputFileSync(filename, content);
  },

  clear() {
    data = {};
  },

  put(cacheKey, cacheValue) {
    data[cacheKey] = cacheValue;
  },

  get(cacheKey) {
    return data[cacheKey];
  }
};

exports.default = cache;