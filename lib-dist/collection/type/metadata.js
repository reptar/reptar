'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _chunk2 = require('lodash/chunk');

var _chunk3 = _interopRequireDefault(_chunk2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _url = require('../../url');

var _url2 = _interopRequireDefault(_url);

var _base = require('../base');

var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A collection that derives its content from a match in a files yaml
 * frontmatter data.
 */
class MetadataCollection extends _base2.default {
  constructor(name, collectionConfig, config, renderer) {
    super(name, collectionConfig, config, renderer);

    /**
     * Object which holds a mapping of metadata value to the files that contain
     * the metadata property.
     * For example with metadata of 'tags' you'd have:
     * {
     *  'tag-name': [file, file],
     *  'other-tag': [file, file]
     * }
     * @type {Object.<string, Array.<File>>}
     */
    this.metadataFiles = (0, _create2.default)(null);
  }

  /**
   * Checks to see if this file passes all requirements to be considered a part
   * of this collection.
   * @param {File} file File object.
   * @return {boolean} true if the file meets all requirements.
   */
  _isFileInCollection(file) {
    return !(0, _isUndefined3.default)(file.data[this.metadata]) && !this.isFiltered(file);
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

    let metadataValues = file.data[this.metadata];
    if (!Array.isArray(metadataValues)) {
      metadataValues = [metadataValues];
    }

    metadataValues.forEach(rawValue => {
      // Slugify each value to make sure there's no collisions when we write
      // CollectionPages to disk. This prevents `open source` and `open-source`
      // from being in two different keys but both writing to the same
      // file-system destination.
      const value = (0, _isString3.default)(rawValue) ? _url2.default.slug(rawValue) : rawValue;
      this.metadataFiles[value] = this.metadataFiles[value] || [];
      this.metadataFiles[value].push(file);

      // Add data to template accessible object.
      this.data.metadata[value] = this.data.metadata[value] || [];
      this.data.metadata[value].push(file.data);
    });

    return true;
  }

  /**
   * Populate the Collection's files via file system path or metadata attribute.
   * @param {Object.<string, Files>} files Object of files.
   * @return {Collection}
   */
  populate(files) {
    // Create metadata files.
    this.metadataFiles = {};

    // Initialize template data.
    this.data.metadata = {};

    // Store files that are in our collection.
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
   * @private
   */
  createCollectionPages() {
    // If no permalink paths are set then we don't render a CollectionPage.
    if (!(this.permalink && this.permalink.index && this.permalink.page)) {
      return false;
    }

    if (!(0, _isEmpty3.default)(this.metadataFiles)) {
      this.pages = [];

      // Create CollectionPage objects to represent our pagination pages.
      (0, _each3.default)(this.metadataFiles, (rawFiles, metadataKey) => {
        // Sort files.
        const files = _base2.default.sortFiles(rawFiles, this.sort, this._config.get('file.dateFormat'));

        // Break up our array of files into arrays that match our defined
        // pagination size.
        const pages = (0, _chunk3.default)(files, this.pageSize);

        pages.forEach((pageFiles, index) => {
          // Create CollectionPage.
          const collectionPage = this.createPage(index, `${this.id}:${metadataKey}:${index}` // Custom ID.
          );

          collectionPage.setData({
            // Extra template information.
            metadata: metadataKey,

            // How many pages in the collection.
            total_pages: pages.length,

            // Posts displayed per page
            per_page: this.pageSize,

            // Total number of posts
            total: files.length
          });

          // Files in the page.
          collectionPage.setFiles(pageFiles);

          // Create a map of the metadataKey to its full URL on the file object.
          // Useful when rendering and wanting to link out to the metadata page.
          pageFiles.forEach(file => {
            file.data.metadataUrls = file.data.metadataUrls || {};
            file.data.metadataUrls[metadataKey] = collectionPage.data.url;
          });

          // Add to our array of pages.
          this.pages.push(collectionPage);
        });
      });
    }

    this._linkPages(
    // ShouldLinkPrevious
    (previous, collectionPage) =>
    // With metadata collections all pages aren't made in the same context.
    // i.e. for a tag metadata collection you'll have 3 pages with metadata
    // value of 'review', and 2 pages of value 'tutorial'. These different
    // metadata values should not be linked.
    previous && this.metadataFiles && previous.data.metadata === collectionPage.data.metadata,
    // ShouldLinkNext
    (next, collectionPage) =>
    // With metadata collections all pages aren't made in the same context.
    // i.e. for a tag metadata collection you'll have 3 pages with metadata
    // value of 'review', and 2 pages of value 'tutorial'. These different
    // metadata values should not be linked.
    next && this.metadataFiles && next.data.metadata === collectionPage.data.metadata);

    return true;
  }
}
exports.default = MetadataCollection;