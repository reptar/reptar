'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _slug = require('slug');

var _slug2 = _interopRequireDefault(_slug);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    // eslint-disable-next-line no-useless-escape
    const PERMALINK_REGEX = /:(\w+[\|A-Z]*)/g;

    const params = permalink.match(PERMALINK_REGEX);

    // If we found no tags in the permalink then just return the given string.
    if (!params) {
      return permalink;
    }

    let result = permalink;

    params.forEach(param => {
      // Replace ':title' -> 'title'.
      let paramKey = param.substr(1);

      let paramPipe;
      if (paramKey.includes('|')) {
        var _paramKey$split = paramKey.split('|');

        var _paramKey$split2 = (0, _slicedToArray3.default)(_paramKey$split, 2);

        paramKey = _paramKey$split2[0];
        paramPipe = _paramKey$split2[1];
      }

      let paramValue = context[paramKey];

      if (paramValue) {
        if (paramPipe) {
          paramValue = _moment2.default.utc(paramValue).format(paramPipe);
        }
        const sanitized = Url.slug(paramValue);
        result = result.replace(param, sanitized);
      } else {
        throw new Error(`${'interpolatePermalink: could not find param value ' + 'for key: '}${paramKey}`);
      }
    });

    return result;
  },

  /**
   * Wrapper around the slug module. Handles taking a string and making it
   * into a slug, a URL safe string.
   * @param {string} str String to slugify.
   * @param {Object} options Slug options.
   * @return {string} Slugified string.
   */
  slug(str, options) {
    return (0, _slug2.default)(str, (0, _extends3.default)({}, slugOptions, {
      options
    }));
  },

  /**
   * Set slug options to be used by Url.slug.
   * @param {Object} options Options
   */
  setSlugOptions(options) {
    slugOptions = options;
  },

  /**
   * Replaces a markdown file path with `.html` if it's a known markdown file.
   * @param {string} filePath A file path.
   * @param {Array.<string>} markdownExtensions Array of known markdown file
   *   extensions.
   * @return {string} Modified file path.
   */
  replaceMarkdownExtension(filePath, markdownExtensions) {
    // Get file extension of file. i.e. 'post.md' would give 'md'.
    const fileExtension = _path2.default.extname(filePath).replace(/^\./, '');
    const index = markdownExtensions.indexOf(fileExtension);

    let result = filePath;

    // Is this file's extension one of our known markdown extensions?
    if (index > -1) {
      const foundExtension = markdownExtensions[index];
      result = filePath.replace(new RegExp(`.${foundExtension}$`), '.html');
    }

    return result;
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
    let result = url;

    // If the url does not end with an extension then we need to modify the URL.
    if (!_path2.default.extname(url)) {
      // If we don't have a leading / then add it.
      if (!url.startsWith('/')) {
        result = `/${url}`;
      }

      // If we don't have a trailing / then add it.
      if (!url.endsWith('/')) {
        result += '/';
      }

      // Append the default file name.
      result += 'index.html';
    }

    return result;
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
   * Resolve a path from the root of the project, taking into account
   * the relative depth we need to go to get to the root of the project,
   * depending if we're in a pre-compiled build or not.
   * @param {...string} args Splat of strings.
   * @return {string} Full path.
   */
  pathFromRoot() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    // Push relative distance from root of project.
    args.unshift(isDistBuild ? '../../' : '../');

    // Add dirname relative from.
    args.unshift(__dirname);

    return _path2.default.resolve.apply(_path2.default, args);
  }
};

exports.default = Url;