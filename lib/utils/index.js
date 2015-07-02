const moment = require('moment');

exports.frontMatter = require('./front-matter');
exports.yaml = require('./yaml');
exports.markdown = require('./markdown');
exports.template = require('./template');

/**
 * Interpolates variables into a permalink structure.
 * @example
 * // returns '/hello-world/'
 * interpolatePermalink('/:title/', {
 *   title: 'hello-world'
 * });
 * @param {string} permalink A permalink template.
 * @param {Object} context An object with keys that if matched to the permalink
 *   will have the value interpolated to the string.
 * @return {string} Actual permalink value.
 */
exports.interpolatePermalink = function(permalink, context) {
  const PERMALINK_REGEX = /:(\w+[\|A-Z]*)/g;

  let params = permalink.match(PERMALINK_REGEX);

  params.forEach(param => {
    // Replace ':title' -> 'title'.
    let paramKey = param.substr(1);

    let paramPipe;
    if (paramKey.includes('|')) {
      [paramKey, paramPipe] = paramKey.split('|');
    }

    let paramValue = context[paramKey];

    if (paramValue) {
      if (paramPipe) {
        paramValue = moment(paramValue).format(paramPipe);
      }
      var sanitized = exports.stringToSlug(paramValue);
      permalink = permalink.replace(param, sanitized);
    } else {
      throw new Error('interpolatePermalink: could not find param value in ' +
        'permalink.');
    }
  });

  return permalink;
};

/**
 * Convert a string to a ready-for-url slug.
 * @param {string} str String to convert.
 * @return {string} Converted string.
 */
exports.stringToSlug = function(str) {
  return str
    // Trim whitespace from ends.
    .trim()
    // Remove non-valid characters.
    .replace(/[^a-z0-9]/gi, '-')
    // Collapse multiple replacements to one.
    .replace(/-+/g, '-')
    // Remove leading and trailing replacements.
    .replace(/^-|-$/g, '')
    // Make all lowercase.
    .toLowerCase();
};

/**
 * When writing to the file system update the permalink so that it renders
 * correctly.
 * @example
 * // returns '/hello-world/index.html'
 * exports.makeUrlFileSystemSafe('/hello-world');
 * @param {string} url Url to make file system safe.
 * @return {string} Safe url.
 */
exports.makeUrlFileSystemSafe = function(url) {
  const REGEX = /\.html$/;

  // If the url does not end with .html then we need to modify the URL.
  if (!url.match(REGEX)) {
    // If we don't have a trailing / then add it.
    if (!url.endsWith('/')) {
      url += '/';
    }

    // Append the default file name.
    url += 'index.html';
  }

  return url;
};

