'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = futureDatesFilter;

/**
 * Future date filter. Checks if a file's date occurs in the future.
 * @param {File} file File we're checking.
 * @param {Object} filterConfig Filter config object.
 * @return {boolean} If the File's date is in the future
 */
function futureDatesFilter(file) {
  let filterConfig = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  const dateKey = filterConfig.key || 'date';
  const fileDate = new Date(file.data[dateKey]).getTime();

  // If the date is in the future we have a positive number.
  return fileDate - Date.now() > 0;
}