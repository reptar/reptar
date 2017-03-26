'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _set2 = require('lodash/set');

var _set3 = _interopRequireDefault(_set2);

var _get2 = require('lodash/get');

var _get3 = _interopRequireDefault(_get2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Handles all metadata about your site that will be accessible within every
 * render context.
 */
class Metadata {
  constructor() {
    /**
     * Site wide data available in all templates.
     * @type {Object.<string, Object>}
     */
    this.metadata = (0, _create2.default)(null);
  }

  /**
   * Gets either the entire metadata object or a part of it.
   * @param {[objPath]} objPath Property path of value we want back.
   * @return {*}
   */
  get(objPath) {
    if (!objPath) {
      return this.metadata;
    }

    return (0, _get3.default)(this.metadata, objPath);
  }

  /**
   * Set a value on our metadata.
   * @param {string|Array} objPath Path where we're setting our value.
   * @param {*} value Value we're setting.
   */
  set(objPath, value) {
    (0, _set3.default)(this.metadata, objPath, value);
  }
}
exports.default = Metadata;