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

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _isNil2 = require('lodash/isNil');

var _isNil3 = _interopRequireDefault(_isNil2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _isNumber2 = require('lodash/isNumber');

var _isNumber3 = _interopRequireDefault(_isNumber2);

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _cache = require('../cache');

var _cache2 = _interopRequireDefault(_cache);

var _checksum = require('../checksum');

var _checksum2 = _interopRequireDefault(_checksum);

var _url = require('../url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class CollectionPage {
  /**
   * Constructor for a CollectionPage.
   * @param {string} collectionId Collection ID.
   * @param {number} pageIndex Page index.
   * @param {Object} options Additional options.
   * @param {Config} options.config Config instance.
   * @param {Renderer} options.renderer Renderer instance.
   * @constructor
   */
  constructor(collectionId, pageIndex) {
    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    let config = _ref.config,
        renderer = _ref.renderer;

    if ((0, _isUndefined3.default)(collectionId)) {
      throw new Error('CollectionPage requires a collection ID as a string.');
    }

    if (!(0, _isNumber3.default)(pageIndex)) {
      throw new Error('CollectionPage requires a page index.');
    }

    /**
     * Unique ID of this CollectionPage. Comprised of its Collection's ID and
     * its page index.
     * @type {string}
     */
    this.id = `${collectionId}:${pageIndex}`;

    /**
     * Collection ID this page is a part of.
     * @type {string}
     */
    this.collectionId = collectionId;

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

    /**
     * Page index, 0-indexed.
     * @type {number}
     */
    this.index = pageIndex;

    /**
     * An array of Files that are in this page.
     * @type {Array.<string>}
     */
    this.files = [];

    /**
     * The permalink template.
     * @type {string}
     */
    this.permalink = '';

    /**
     * Data accessible from template.
     * @type {Object}
     */
    this.data = (0, _create2.default)(null);

    // Current page number, 1-indexed for display purposes.
    this.data.page = this.index + 1;
  }

  setData() {
    let data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    // Current page number.
    if (!(0, _isUndefined3.default)(data.page) && !(0, _isNumber3.default)(data.page)) {
      throw new Error('CollectionPage requires \'page\' as a number.');
    }

    // How many pages in the collection.
    if (!(0, _isUndefined3.default)(data.total_pages) && !(0, _isNumber3.default)(data.total_pages)) {
      throw new Error('CollectionPage requires \'total_pages\' as a number.');
    }

    // Posts displayed per page.
    if (!(0, _isUndefined3.default)(data.per_page) && !(0, _isNumber3.default)(data.per_page)) {
      throw new Error('CollectionPage requires \'per_page\' as a number.');
    }

    // Total number of posts.
    if (!(0, _isUndefined3.default)(data.total) && !(0, _isNumber3.default)(data.total)) {
      throw new Error('CollectionPage requires \'total\' as a number.');
    }

    // Update content that's accessible from template.
    (0, _assign2.default)(this.data, data);

    this._calculateDestination();
  }

  /**
   * Set what files belong in this page.
   * @param {Array.<File>} files Array of files.
   */
  setFiles(files) {
    if (!(0, _isUndefined3.default)(files) && !(0, _isArray3.default)(files)) {
      throw new Error('Files must be an array.');
    }

    // Save Files in this Page.
    this.files = files;

    /**
     * Array of File data in this page.
     * @type {Array.<File>}
     */
    this.data.files = files.map(file => file.data);
  }

  /**
   * Generate the checksum of this CollectionPage. It's derived from the Files
   * that exist in this collection.
   * @return {string}
   */
  getChecksum() {
    const fileChecksums = this.files.map(file => file.checksum);

    const checksum = (0, _checksum2.default)(fileChecksums.join(''));

    return checksum;
  }

  /**
   * Link this page with its previus page, for use in templates.
   * @param {CollectionPage} previous CollectionPage instance.
   */
  setPreviousPage(previous) {
    (0, _assign2.default)(this.data, {
      // Previous page number. 0 if the current page is the first.
      prev: previous.data.page,

      // The URL of previous page. '' if the current page is the first.
      prev_link: previous.data.url
    });
  }

  /**
  * Link this page with its next page, for use in templates.
  * @param {CollectionPage} next CollectionPage instance.
   */
  setNextPage(next) {
    (0, _assign2.default)(this.data, {
      // Next page number. 0 if the current page is the last.
      next: next.data.page,

      // The URL of next page. '' if the current page is the last.
      next_link: next.data.url
    });
  }

  /**
   * Calculate both relative and absolute destination path for where to write
   * the file.
   * @private
   */
  _calculateDestination() {
    // Calculate the permalink value.
    const relativeDestination = _url2.default.interpolatePermalink(this.permalink, this.data);

    /**
     * Absolute destination path.
     * @type {string} destination Absolute path to file.
     */
    this.destination = _url2.default.makeUrlFileSystemSafe(relativeDestination);

    /**
     * The URL without the domain, but with a leading slash,
     * e.g.  /2008/12/14/my-post.html
     * @type {string} url Relative path to file.
     */
    this.data.url = _url2.default.makePretty(this.destination);
  }

  /**
   * Update a CollectionPage's content via updating every File's content.
   */
  update() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      yield _bluebird2.default.all(_this.files.map(function (file) {
        return file.update();
      }));

      _this.data.files = _this.files.map(function (file) {
        return file.data;
      });
    })();
  }

  render(globalData) {
    const templateData = (0, _extends3.default)({}, globalData, {
      pagination: this.data
    });

    const template = this.data.template;

    if ((0, _isNil3.default)(template)) {
      let errMsg = 'CollectionPage: No template given.\nData object: ';
      errMsg += (0, _stringify2.default)(this.data);
      throw new Error(errMsg);
    }

    return this._renderer.renderTemplate(template, templateData);
  }

  /**
   * Writes a given CollectionPage to the file system.
   * @param {Object} globalData Site wide data.
   */
  write(globalData) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const checksum = _this2.getChecksum();

      if (_this2._config.get('incremental') && _cache2.default.get(_this2.id) === checksum) {
        return;
      }

      const content = yield _this2.render(globalData);

      const destinationPath = _path2.default.join(_this2._config.get('path.destination'), _this2.destination);

      yield _bluebird2.default.fromCallback(function (cb) {
        _fsExtra2.default.outputFile(destinationPath, content, 'utf8', cb);
      });

      // Save checksum to cache for incremental builds.
      _cache2.default.put(_this2.id, checksum);
    })();
  }
}
exports.default = CollectionPage;