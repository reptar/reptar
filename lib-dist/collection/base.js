'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sortBy2 = require('lodash/sortBy');

var _sortBy3 = _interopRequireDefault(_sortBy2);

var _isNumber2 = require('lodash/isNumber');

var _isNumber3 = _interopRequireDefault(_isNumber2);

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _page = require('./page');

var _page2 = _interopRequireDefault(_page);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class CollectionBase {
  /**
   * Create a Collection instance.
   * @param {string} name The name of the collection.
   * @param {Object} collectionConfig Config object from config file.
   * @param {Config} config Config instance.
   * @param {Renderer} renderer Renderer instance.
   */
  constructor(name) {
    let collectionConfig = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let config = arguments[2];
    let renderer = arguments[3];

    if ((0, _isString3.default)(name) === false || name.length === 0) {
      throw new Error('Collection requires a name.');
    }

    /**
     * Unique ID of this Collection, currently its given name.
     * @type {string}
     */
    this.id = name;

    /**
     * The collection name. Must be unique.
     * @type {string}
     */
    this.name = name;

    /**
     * Data accesible to templates.
     * @type {Object}
     */
    this.data = {};

    /**
     * @type {Config}
     * @protected
     */
    this._config = config;

    /**
     * @type {Renderer}
     * @protected
     */
    this._renderer = renderer;

    if (!(0, _isUndefined3.default)(collectionConfig.path)) {
      /**
       * Path where items belong within the collection.
       * @type {string}
       */
      this.path = _path2.default.resolve(this._config.get('path.source'), collectionConfig.path);
    }

    if (!(0, _isUndefined3.default)(collectionConfig.metadata)) {
      /**
       * Metadata attribute to use to find which items are within the
       * collection.
       * @type {string}
       */
      this.metadata = collectionConfig.metadata;
    }

    if (!(0, _isUndefined3.default)(collectionConfig.template)) {
      /**
        * What template to use when rendering a CollectionPage.
       * @type {string}
       */
      this.template = collectionConfig.template;
    }

    if (!(0, _isUndefined3.default)(collectionConfig.pageSize)) {
      if (!(0, _isNumber3.default)(collectionConfig.pageSize)) {
        throw new Error('Page size must be a number');
      }

      /**
       * Size of each CollectionPage.
       * @type {number}
       */
      this.pageSize = collectionConfig.pageSize;
    }

    if (!(0, _isUndefined3.default)(collectionConfig.sort)) {
      /**
       * Sorting configuration.
       * @type {Object}
       */
      this.sort = {
        key: collectionConfig.sort.key,
        order: collectionConfig.sort.order
      };
    }

    if (!(0, _isUndefined3.default)(collectionConfig.permalink)) {
      const permalinkConfig = collectionConfig.permalink;

      /**
       * Permalink information.
       * @type {Object}
       */
      this.permalink = {};

      if (!(0, _isUndefined3.default)(permalinkConfig.index)) {
        /**
         * Permalink index configuration.
         * @type {string}
         */
        this.permalink.index = permalinkConfig.index;
      }

      if (!(0, _isUndefined3.default)(permalinkConfig.page)) {
        /**
         * Permalink page configuration.
         * @type {string}
         */
        this.permalink.page = permalinkConfig.page;
      }
    }

    /**
     * Array of CollectionPage objects.
     * @type {Array.<CollectionPage>}
     */
    this.pages = [];
  }

  /**
   * Whether a File is filtered by the configured filters.
   * @param {File} file File object.
   * @return {boolean} Whether this file should be filtered out.
   */
  isFiltered(file) {
    // eslint-disable-line class-methods-use-this
    return file.filtered === true;
  }

  /**
   * Populate the Collection's files via file system path or metadata attribute.
   * @param {Object.<string, Files>} files All Files.
   * @param {Object.<string, CollectionBase>} collections Object of all
   *   collections.
   * @return {CollectionBase}
   */
  populate() {
    let files = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let collections = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    // eslint-disable-line no-unused-vars
    return this;
  }

  /**
   * Create a CollectionPage instance.
   * @param {number} index Index of the page.
   * @param {string?} pageIdArg Optional custom ID for a CollectionPage.
   * @return {CollectionPage} CollectionPage instance.
   */
  createPage(index, pageIdArg) {
    if (!(0, _isNumber3.default)(index)) {
      throw new Error('Must give an index when creating a CollectionPage.');
    }

    const pageId = (0, _isUndefined3.default)(pageIdArg) ? this.id : pageIdArg;

    const page = new _page2.default(pageId, index, {
      config: this._config,
      renderer: this._renderer
    });

    page.permalink = index === 0 ? this.permalink.index : this.permalink.page;

    // Give each CollectionPage what template it should use.
    page.data.template = this.template;

    return page;
  }

  _linkPages(shouldLinkPrevious, shouldLinkNext) {
    if (this.pages.length > 0) {
      this.pages.forEach((collectionPage, index) => {
        const previous = this.pages[index - 1];

        if (shouldLinkPrevious(previous, collectionPage)) {
          collectionPage.setPreviousPage(previous);
        }

        const next = this.pages[index + 1];

        if (shouldLinkNext(next, collectionPage)) {
          collectionPage.setNextPage(next);
        }
      });
    }

    // Add data to template accessible object.
    this.data.pages = this.pages.map(page => page.data);

    return this;
  }

  /**
   * Writes every page in this collection.
   * @param {Object} siteData Site wide data that is shared on all rendered
   *  pages.
   * @return {Promise}
   */
  write(siteData) {
    let pagePromises = [];

    // Write CollectionPage files.
    if (this.pages.length) {
      pagePromises = this.pages.map(collectionPage => collectionPage.write(siteData));
    }

    return _bluebird2.default.all(pagePromises);
  }

  /**
   * Sorts files according to a sort config object.
   * @param {Array.<File>} files Array of File objects.
   * @param {Object} sortConfig Sort config object.
   * @param {string?} dateFormat Optional. File date format from config.
   * @return {Array.<file>} Sorted files.
   */
  static sortFiles(files, sortConfig, dateFormat) {
    const validSortConfig = sortConfig && sortConfig.key;
    const hasFiles = files && files.length > 0;

    if (validSortConfig && hasFiles) {
      // Convert a File's date value to a time stamp for sorting.
      const getFileDateTime = file => (0, _moment2.default)(file.data[sortConfig.key], dateFormat).toDate().getTime();

      // Quick sniff to see if the sort value is a date object.
      const sortIsDate = getFileDateTime(files[0]) > 0;

      // eslint-disable-next-line no-param-reassign
      files = (0, _sortBy3.default)(files, sortIsDate ? getFileDateTime : `data[${sortConfig.key}]`);

      if (sortConfig.order === 'descending') {
        files.reverse();
      }
    }

    return files;
  }
}
exports.default = CollectionBase;