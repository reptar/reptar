/**
 * YAML operations, parse or stringify.
 */
const jsYaml = require('js-yaml');

/**
 * Parse a YAML string into an object.
 * @param {string} str String containing YAML information.
 * @return {Object} Parsed YAML object.
 */
exports.parse = function(str) {
  return jsYaml.safeLoad(str);
};

/**
 * Stringify an object to a YAML string.
 * @param {Object} obj JavaScript object.
 * @return {string} YAML document.
 */
exports.stringify = function(obj) {
  return jsYaml.safeDump(obj);
};

