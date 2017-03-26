'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _chunk2 = require('lodash/chunk');

var _chunk3 = _interopRequireDefault(_chunk2);

var _values2 = require('lodash/values');

var _values3 = _interopRequireDefault(_values2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _reduce2 = require('lodash/reduce');

var _reduce3 = _interopRequireDefault(_reduce2);

var _base = require('../base');

var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A collection that derives its content from the location of a file in the
 * file system.
 */
class FileSystemCollection extends _base2.default {
  constructor(name, collectionConfig, config, renderer) {
    super(name, collectionConfig, config, renderer);

    /**
     * Array of file id's that belong in this collection.
     * @type {Object.<string, File>}
     */
    this.files = {};

    /**
     * Array of paths to exclude from including in this collection.
     * @type {Array.<string>}
     */
    this.excludePaths = [];
  }

  /**
   * Set what paths to exclude from including in this collection.
   * @param {Object.<string, CollectionBase>} collections Array of Collections.
   */
  _setExcludePaths(collections) {
    this.excludePaths = (0, _reduce3.default)(collections, (allPaths, collection) => {
      // Only include a collection path if it exists and isn't the app source,
      // and isn't this collection's path.
      if (collection.path && collection.path !== this.path && collection.path !== this._config.get('path.source')) {
        allPaths.push(collection.path);
      }

      return allPaths;
    }, []);
  }

  /**
   * Is this file's path included in this collection's excludePaths.
   * @param {File} file File object.
   * @return {boolean} true if the file's path includes an exclude path.
   * @private
   */
  _isFileExcluded(file) {
    return this.excludePaths.some(path => file.path.includes(path));
  }

  /**
   * Checks to see if this file passes all requirements to be considered a part
   * of this collection.
   * @param {File} file File object.
   * @return {boolean} true if the file meets all requirements.
   */
  _isFileInCollection(file) {
    return file.path.includes(this.path) && !this._isFileExcluded(file) && !this.isFiltered(file);
  }

  /**
   * Add a file to the collection.
   * @param {File} file File object.
   * @return {boolean} True if the file was added to the collection.
   */
  addFile(file) {
    if (!this._isFileInCollection(file)) {
      return false;
    }

    // Add file.
    this.files[file.id] = file;

    // Add data to template accessible object.
    this.data.files.push(file.data);

    return true;
  }

  /**
   * Populate the Collection's files via file system path or metadata attribute.
   * @param {Object.<string, Files>} files All Files.
   * @param {?Object.<string, CollectionBase>} collections Object of all
   *   collections.
   * @return {Collection}
   */
  populate(files, collections) {
    if (!(0, _isUndefined3.default)(collections)) {
      this._setExcludePaths(collections);
    }

    // Add data to template accessible object.
    this.data.files = [];

    (0, _each3.default)(files, file => {
      // Don't return value so we iterate over every file.
      this.addFile(file);
    });

    this.createCollectionPages();

    return this;
  }

  /**
   * Create CollectionPage objects for our Collection.
   * @return {boolean} True if we successfully created CollectionPages.
   */
  createCollectionPages() {
    // If no permalink paths are set then we don't render a CollectionPage.
    if (!(this.permalink && this.permalink.index && this.permalink.page)) {
      return false;
    }

    if (!(0, _isEmpty3.default)(this.files)) {
      this.pages = [];

      // Sort files according to config.
      const files = _base2.default.sortFiles((0, _values3.default)(this.files), this.sort, this._config.get('file.dateFormat'));

      // Break up our array of files into arrays that match our defined
      // pagination size.
      const pages = (0, _chunk3.default)(files, this.pageSize);

      pages.forEach((pageFiles, index) => {
        const collectionPage = this.createPage(index);

        // Files in the page.
        collectionPage.setFiles(pageFiles);

        // Update CollectionPage template data.
        collectionPage.setData({
          // How many pages in the collection.
          total_pages: pages.length,

          // Posts displayed per page.
          per_page: this.pageSize,

          // Total number of posts.
          total: files.length
        });

        // Add to our array of pages.
        this.pages.push(collectionPage);
      });
    }

    this._linkPages(
    // ShouldLinkPrevious
    previous => previous,
    // ShouldLinkNext
    next => next);

    return true;
  }
}
exports.default = FileSystemCollection;