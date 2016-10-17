import _ from 'lodash';

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
export default function metadataFilter(file, filterConfig) {
  return _.isMatch(file.data, filterConfig);
}
