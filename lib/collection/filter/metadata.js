import _ from 'lodash';

let matchFn;

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
  if (!matchFn) {
    matchFn = _.matches(filterConfig);
  }

  return matchFn(file.data);
}

metadataFilter.reset = () => {
  matchFn = undefined;
};

export default metadataFilter;
