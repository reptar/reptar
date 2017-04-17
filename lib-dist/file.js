'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _isNil2 = require('lodash/isNil');

var _isNil3 = _interopRequireDefault(_isNil2);

var _defaults2 = require('lodash/defaults');

var _defaults3 = _interopRequireDefault(_defaults2);

var _isMatch2 = require('lodash/isMatch');

var _isMatch3 = _interopRequireDefault(_isMatch2);

var _reduceRight2 = require('lodash/reduceRight');

var _reduceRight3 = _interopRequireDefault(_reduceRight2);

var _merge2 = require('lodash/merge');

var _merge3 = _interopRequireDefault(_merge2);

var _isObject2 = require('lodash/isObject');

var _isObject3 = _interopRequireDefault(_isObject2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _checksum = require('./checksum');

var _checksum2 = _interopRequireDefault(_checksum);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _url = require('./url');

var _url2 = _interopRequireDefault(_url);

var _parse = require('./parse');

var _parse2 = _interopRequireDefault(_parse);

var _cache = require('./cache');

var _cache2 = _interopRequireDefault(_cache);

var _filter = require('./filter');

var _filter2 = _interopRequireDefault(_filter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class File {
  constructor() {
    let filePath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    let config = _ref.config,
        renderer = _ref.renderer;

    /**
     * Unique ID for this file. Right now an alias for the file's path.
     * @type {string}
     */
    this.id = filePath;

    /**
     * Absolute path to file location.
     * @type {string}
     */
    this.path = filePath;

    /**
     * Absolute destination path of where file should be written.
     * @type {string} destination Absolute path to file.
     */
    this.destination = '';

    /**
     * Frontmatter for this file. Can be undefined if a file has no frontmatter.
     * @type {object}
     */
    this.frontmatter = (0, _create2.default)(null);

    /**
     * Template accessible data.
     * @type {Object.<string, Object>}
     */
    this.data = (0, _create2.default)(null);

    /**
     * Should we skip processing this file, ignoring templates and markdown
     * conversion. This is generally only true for images and similar files.
     * @type {boolean}
     */
    this.skipProcessing = false;

    /**
     * An asset processor that will handle rendering this file.
     * @type {function?}
     */
    this.assetProcessor = null;

    /**
     * If this File is filtered out of rendering. Filter settings are defined
     * in the {@link Config.ConfigFilename} file.
     * @type {boolean}
     */
    this.filtered = false;

    /**
     * @type {Config}
     * @private
     */
    this._config = config;

    /**
     * @type {Renderer}
     * @private
     */
    this._renderer = renderer;
  }

  /**
   * Update's File's data from the file system.
   */
  update() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      // Check if a file has frontmatter.
      const hasFrontmatter = yield _parse2.default.fileHasFrontmatter(_this.path);

      // If File doesn't have frontmatter then return early.
      if (!hasFrontmatter) {
        const assetConfig = _this._config.get('assets').find(function (_ref2) {
          let test = _ref2.test;
          return test(_this.path);
        });

        if (assetConfig) {
          _this.assetProcessor = assetConfig.use;
        }

        _this.skipProcessing = true;
        _this._calculateDestination();
        return;
      }

      /**
       * Raw contents of file, directly from file system.
       * @type {string} One long string.
       */
      const rawContent = yield _bluebird2.default.fromCallback(function (cb) {
        return _fsExtra2.default.readFile(_this.path, 'utf8', cb);
      });

      /**
       * Checksum hash of rawContent, for use in seeing if file is different.
       * @example:
       *  '50de70409f11f87b430f248daaa94d67'
       * @type {string}
       */
      _this.checksum = (0, _checksum2.default)(rawContent);

      // Try to parse File's frontmatter.
      let parsedContent;
      try {
        parsedContent = _parse2.default.fromFrontMatter(rawContent);
      } catch (e) {}
      // Couldn't parse File's frontmatter.


      // Ensure we have an object to dereference.
      if (!(0, _isObject3.default)(parsedContent)) {
        parsedContent = {};
      }

      var _parsedContent = parsedContent;
      const frontmatter = _parsedContent.data,
            content = _parsedContent.content;

      // Create new data object.

      _this.data = (0, _create2.default)(null);

      _this.frontmatter = frontmatter;

      _this.defaults = _this._gatherDefaults();

      // Merge in new data that's accessible from template.
      (0, _merge3.default)(_this.data, _this.defaults, _this.frontmatter, {
        // The content of the Page.
        content
      });

      _this.filtered = _filter2.default.isFileFiltered(_this._config.get('file.filters'), _this);

      try {
        _this._calculateDestination();
      } catch (e) {
        throw new Error('Unable to calculate destination for file at ' + `${_this.path}. Message: ${e.message}`);
      }
    })();
  }

  /**
   * Gather default values that should be applied to this file.
   * @return {Object} Default values applied to this file.
   */
  _gatherDefaults() {
    // Defaults are sorted from least to most specific, so we iterate over them
    // in the reverse order to allow most specific first chance to apply their
    // values.
    return (0, _reduceRight3.default)(this._config.get('file.defaults'), (acc, defaultObj) => {
      const scope = defaultObj.scope,
            values = defaultObj.values;

      // If default path property is defined does it exist within this file's
      // path.

      const pathMatches = scope.path != null ? this.path.includes(scope.path) : true;

      // If metadata is set the does it match the file's metadata.
      const metadataMatches = (0, _isObject3.default)(scope.metadata) ? (0, _isMatch3.default)(this.frontmatter, scope.metadata) : true;

      // If we have a match then apply the values.
      if (pathMatches && metadataMatches) {
        return (0, _defaults3.default)(acc, values);
      }

      return acc;
    }, {});
  }

  /**
   * Calculate both relative and absolute destination path for where to write
   * the file.
   * @private
   */
  _calculateDestination() {
    let destinationUrl;

    /**
     * If the file itself wants to customize what its URL is then it will use
     * the `config.file.urlKey` value of the File's frontmatter as the basis
     * for which the URL of this file should be.
     * So if you have a File with a frontmatter that has `url: /pandas/` then
     * the File's URL will be `/pandas/`.
     * @type {string?} url Relative path to file.
     */
    const url = this.frontmatter[this._config.get('file.urlKey')];

    if (url) {
      // If the individual File defined its own unique URL that gets first
      // dibs at setting the official URL for this file.
      destinationUrl = url;
    } else if (this.data.permalink) {
      // If the file has no URL but has a permalink set on it then use it to
      // find the URL of the File.
      destinationUrl = _url2.default.interpolatePermalink(this.data.permalink, this.data);
    } else {
      // Path to file relative to root of project.
      const pathRelative = this.path.replace(this._config.get('path.source'), '');

      // If the file has no URL set and no permalink then use its relative file
      // path as its url.
      destinationUrl = _url2.default.replaceMarkdownExtension(pathRelative, this._config.get('markdown.extensions'));
    }

    if (this.assetProcessor) {
      destinationUrl = this.assetProcessor.calculateDestination(destinationUrl);
    }

    this.destination = _url2.default.makeUrlFileSystemSafe(destinationUrl);
    this.data.url = _url2.default.makePretty(this.destination);
  }

  /**
   * Render the markdown into HTML.
   * If there is an assetProcessor then we delegate render responsibility to
   * that assetProcessor.
   * @param {Object} globalData Global site metadata.
   * @return {string} Rendered content.
   */
  render(globalData) {
    if (this.assetProcessor) {
      return this.assetProcessor.render(this);
    }

    const template = this.data.template;

    let result = this.data.content;

    const templateData = (0, _extends3.default)({}, globalData, {
      file: this.data
    });

    try {
      // Set result of content to result content.
      result = this._renderer.renderTemplateString(this.data.content, templateData);

      // Set result to file's contents.
      this.data.content = result;
    } catch (e) {
      _log2.default.error(e.message);
      throw new Error('File: Could not render file\'s contents.\n' + `File: ${(0, _stringify2.default)(this)}`);
    }

    // Convert to HTML.
    // However if the File's frontmatter sets markdown value to false then
    // skip the markdown conversion.
    if (this.data.markdown !== false) {
      result = this._renderer.renderMarkdown(this.data.content);
      this.data.content = result;
    }

    if (!(0, _isNil3.default)(template) && !((0, _isString3.default)(template) && template.length === 0)) {
      result = this._renderer.renderTemplate(template, templateData);
    }

    return result;
  }

  /**
   * Writes a given File object to the file system.
   * @param {Object} globalData Site wide data.
   */
  write(globalData) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const destinationPath = _path2.default.join(_this2._config.get('path.destination'), _this2.destination);

      if (_this2.assetProcessor) {
        const content = yield _this2.render(_this2);
        yield _bluebird2.default.fromCallback(function (cb) {
          _fsExtra2.default.outputFile(destinationPath, content, 'utf8', cb);
        });
        return;
      }

      // If this File is a static asset then we don't process it at all, and just
      // copy it to its destination path.
      // This typically applies to images and other similar files.
      if (_this2.skipProcessing) {
        yield _bluebird2.default.fromCallback(function (cb) {
          return _fsExtra2.default.copy(_this2.path, destinationPath, cb);
        });
        return;
      }

      // Don't write File if it is filtered.
      if (_this2.filtered) {
        return;
      }

      const content = yield _this2.render(globalData);

      if (_this2._config.get('incremental') && _cache2.default.get(_this2.path) === _this2.checksum) {
        return;
      }

      yield _bluebird2.default.fromCallback(function (cb) {
        _fsExtra2.default.outputFile(destinationPath, content, 'utf8', cb);
      });

      // Save checksum to cache for incremental builds.
      _cache2.default.put(_this2.path, _this2.checksum);
    })();
  }
}
exports.default = File;