'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isMatch2 = require('lodash/isMatch');

var _isMatch3 = _interopRequireDefault(_isMatch2);

exports.default = metadataFilter;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Metadata filter. Checks if a file.data object matches all the configured
 * filter options.
 * @example
 * let filterConfig = {
 *   draft: true
 * };
 * file.data = {
 *   title: 'foo',
 *   draft: true
 * };
 * metadataFilter(filterConfig, file); // true
 * @param {File} file File we're checking.
 * @param {Object} filterConfig Filter config object.
 * @return {boolean} If the File matches the filterConfig object.
 */
function metadataFilter(file, filterConfig) {
  return (0, _isMatch3.default)(file.data, filterConfig);
}