import _ from 'lodash';

import CollectionBase from '../base';

/**
 * A collection that derives its content from the location of a file in the
 * file system.
 */
export default class FileSystemCollection extends CollectionBase {
  constructor(name, collectionConfig, getConfig) {
    super(name, collectionConfig, getConfig);

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
    this.excludePaths = _.reduce(collections, (allPaths, collection) => {
      // Only include a collection path if it exists and isn't the app source,
      // and isn't this collection's path.
      if (collection.path &&
          collection.path !== this.path &&
          collection.path !== this._getConfig().get('path.source')) {
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
    return file.path.includes(this.path) &&
      !this._isFileExcluded(file) &&
      !this.isFiltered(file);
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
    if (!_.isUndefined(collections)) {
      this._setExcludePaths(collections);
    }

    // Add data to template accessible object.
    this.data.files = [];

    _.each(files, file => {
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
    if (!(this.pagination &&
          this.pagination.permalinkIndex && this.pagination.permalinkPage)) {
      return false;
    }

    if (!_.isEmpty(this.files)) {
      this.pages = [];

      // Sort files according to config.
      const files = CollectionBase.sortFiles(_.values(this.files), this.sort);

      // Break up our array of files into arrays that match our defined
      // pagination size.
      const pages = _.chunk(files, this.pagination.size);

      pages.forEach((pageFiles, index) => {
        const collectionPage = this.createPage(index);

        // Files in the page.
        collectionPage.setFiles(pageFiles);

        // Update CollectionPage template data.
        collectionPage.setData({
          // How many pages in the collection.
          total_pages: pages.length,

          // Posts displayed per page.
          per_page: this.pagination.size,

          // Total number of posts.
          total: files.length
        });

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
