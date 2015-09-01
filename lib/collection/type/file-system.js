const reduce = require('lodash/collection/reduce');
const chunk = require('lodash/array/chunk');

const config = require('../../config');
const CollectionPage = require('../page');
const CollectionBase = require('../base');

/**
 * A collection that derives its content from the location of a file in the
 * file system.
 */
class FileSystemCollection extends CollectionBase {
  constructor(name, collectionConfig) {
    super(name, collectionConfig);

    /**
     * Array of file id's that belong in this collection.
     * @type {Array.<File>}
     */
    this.files;

    /**
     * Array of paths to exclude from including in this collection.
     * @type {Array.<string>}
     */
    this.excludePaths;
  }

  /**
   * Set what paths to exclude from including in this collection.
   * @param {Array.<CollectionBase>} collections Array of Collections.
   */
  _setExcludePaths(collections) {
    this.excludePaths = collections.reduce((allPaths, collection) => {
      // Only include a collection path if it exists and isn't the app source,
      // and isn't this collection's path.
      if (collection.path &&
          collection.path !== this.path &&
          collection.path !== config.path.source) {
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
    if (this.path && this.excludePaths && this.excludePaths.length) {
      return this.excludePaths.some(path => file.path.includes(path));
    } else {
      return false;
    }
  }

  /**
   * Checks to see if this file passes all requirements to be considered a part
   * of this collection.
   * @param {File} file File object.
   * @return {boolean} true if the file meets all requirements.
   */
  _isFileInCollection(file) {
    return file.path.includes(this.path) && !this._isFileExcluded(file);
  }

  /**
   * Populate the Collection's files via file system path or metadata attribute.
   * @param {Array.<Files>} files Array of files.
   * @param {Array.<CollectionBase>} collections Array of all collections.
   * @return {Collection}
   */
  populate(files, collections = []) {
    this._setExcludePaths(collections);

    this.files = reduce(files, (all, file) => {
      if (this._isFileInCollection(file)) {
        all.push(file);

        // Set what permalink the file should use.
        file.permalink = this.permalink;

        // Add collection names.
        file.collectionNames.add(this.name);
      }

      return all;
    }, []);

    this.files = CollectionBase.sortFiles(this.files, this.sort);

    // Add data to template accessible object.
    this.data.files = this.files.map(file => file.data);

    this._createCollectionPages();

    return this;
  }

  /**
   * Create CollectionPage objects for our Collection.
   * @return {boolean} True if we successfully created CollectionPages.
   * @private
   */
  _createCollectionPages() {
    // If no permalink paths are set then we don't render a CollectionPage.
    if (!(this.pagination &&
          this.pagination.permalinkIndex && this.pagination.permalinkPage)) {
      return false;
    }

    if (this.files) {
      // Break up our array of files into arrays that match our defined
      // pagination size.
      let pages = chunk(this.files, this.pagination.size);

      pages.forEach((pageFiles, index) => {
        let collectionPage = new CollectionPage(
          pageFiles,
          index === 0 ?
            this.pagination.permalinkIndex :
            this.pagination.permalinkPage,
          {
            // Current page number.
            page: index + 1, // Make 1-indexed.

            // How many pages in the collection.
            total_pages: pages.length,

            // Posts displayed per page.
            per_page: this.pagination.size,

            // Total number of posts.
            total: this.files.length
          }
        );

        // Add to our array of pages.
        this.pages.push(collectionPage);
      });
    }

    this._linkPages(
      // ShouldLinkPrevious
      (previous) => {
        return previous;
      },
      // ShouldLinkNext
      (next) => {
        return next;
      }
    );

    return true;
  }
}

module.exports = FileSystemCollection;