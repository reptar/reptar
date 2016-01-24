import moment from 'moment';
import slug from 'slug';
import path from 'path';

/**
 * Are we running within a dist build (i.e. pre-compiled)?
 * @type {boolean} True if we're running in the dist folder.
 */
const isDistBuild = __dirname.indexOf('dist') > -1;

// Cached slug options.
let slugOptions;

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
   * @param {Object} options Slug options.
   * @return {string} Slugified string.
   */
  slug(str, options) {
    return slug(str, {
      ...slugOptions,
      options,
    });
  },

  /**
   * Set slug options to be used by Url.slug.
   * @param {Object} options Options
   */
  setSlugOptions(options) {
    slugOptions = options;
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
      // If we don't have a leading / then add it.
      if (!url.startsWith('/')) {
        url = '/' + url;
      }

      // If we don't have a trailing / then add it.
      if (!url.endsWith('/')) {
        url += '/';
      }

      // Append the default file name.
      url += 'index.html';
    }

    return url;
  },

  /**
   * Given a URL that ends with 'index.html' it'll strip it off and return the
   * resulting value. Useful when creating URLs in a template.
   * @param {string} url Url to augment.
   * @return {string} Augmented url.
   */
  makePretty(url) {
    const makePrettyRegEx = /\/index.html$/;
    return url.replace(makePrettyRegEx, '/');
  },

  /**
   * Resolve a path from the root of the Yarn project, taking into account
   * the relative depth we need to go to get to the root of the Yarn project,
   * depending if we're in a pre-compiled build or not.
   * @param {...string} args Splat of strings.
   * @return {string} Full path.
   */
  pathFromRoot(...args) {
    // Push relative distance from root of project.
    args.unshift(
      isDistBuild ? '../../' : '../'
    );

    // Add dirname relative from.
    args.unshift(__dirname);

    return path.resolve.apply(path, args);
  },
};

export default Url;