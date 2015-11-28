import moment from 'moment';
import slug from 'slug';
import path from 'path';
import isString from 'lodash/lang/isString';
import config from './config';

const Url = {
  /**
   * Interpolates variables into a permalink structure.
   * @example
   * // returns '/hello-world/'
   * interpolatePermalink('/:title/', {
   *   title: 'hello-world'
   * });
   * @param {string} permalink A permalink template.
   * @param {Object} context An object with keys that if matched to the
   *   permalink will have the value interpolated to the string.
   * @return {string} Actual permalink value.
   */
  interpolatePermalink(permalink, context) {
    const PERMALINK_REGEX = /:(\w+[\|A-Z]*)/g;

    let params = permalink.match(PERMALINK_REGEX);

    // If we found no tags in the permalink then just return the given string.
    if (!params) {
      return permalink;
    }

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
        var sanitized = Url.slug(paramValue);
        permalink = permalink.replace(param, sanitized);
      } else {
        throw new Error('interpolatePermalink: could not find param value ' +
          'for key: ' + paramKey);
      }
    });

    return permalink;
  },

  /**
   * Wrapper around the slug module. Handles taking a string and making it
   * into a slug, a URL safe string.
   * @param {string} str String to slugify.
   * @param {Object} options Slug options, by default taken from config file.
   * @return {string} Slugified string.
   */
  slug(str, options = config.slug) {
    return slug(str, options);
  },

  /**
   * Convert a string to a ready-for-url slug.
   * @param {string} str String to convert.
   * @return {string} Converted string.
   */
  stringToSlug(str) {
    return (isString(str) ? str : String(str))
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
  },

  /**
   * When writing to the file system update the permalink so that it renders
   * correctly.
   * @example
   * // returns '/hello-world/index.html'
   * Url.makeUrlFileSystemSafe('/hello-world');
   * @param {string} url Url to make file system safe.
   * @return {string} Safe url.
   */
  makeUrlFileSystemSafe(url) {
    // If the url does not end with an extension then we need to modify the URL.
    if (!path.extname(url)) {
      // If we don't have a trailing / then add it.
      if (!url.endsWith('/')) {
        url += '/';
      }

      // Append the default file name.
      url += 'index.html';
    }

    return url;
  }
};

export default Url;