/**
 * YAML operations, parse or stringify.
 */
import jsYaml from 'js-yaml';

/**
 * Parse a YAML string into an object.
 * @param {string} str String containing YAML information.
 * @return {Object} Parsed YAML object.
 */
export function parse(str) {
  return jsYaml.safeLoad(str);
}

/**
 * Stringify an object to a YAML string.
 * @param {Object} obj JavaScript object.
 * @return {string} YAML document.
 */
export function stringify(obj) {
  return jsYaml.safeDump(obj);
}
