/**
 * Future date filter. Checks if a file's date occurs in the future.
 * @param {File} file File we're checking.
 * @param {Object} filterConfig Filter config object.
 * @return {boolean} If the File's date is in the future
 */
export default function futureDatesFilter(file, filterConfig = {}) {
  const dateKey = filterConfig.key || 'date';
  const fileDate = new Date(file.data[dateKey]).getTime();

  // If the date is in the future we have a positive number.
  return fileDate - Date.now() > 0;
}
