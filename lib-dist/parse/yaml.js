'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parse = parse;
exports.stringify = stringify;

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Parse a YAML string into an object.
 * @param {string} str String containing YAML information.
 * @return {Object} Parsed YAML object.
 */
function parse(str) {
  return _jsYaml2.default.safeLoad(str);
}

/**
 * Stringify an object to a YAML string.
 * @param {Object} obj JavaScript object.
 * @return {string} YAML document.
 */
/**
 * YAML operations, parse or stringify.
 */
function stringify(obj) {
  return _jsYaml2.default.safeDump(obj);
}