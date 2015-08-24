const Promise = require('bluebird');
const path = require('path');
const fs = require('fs-extra');
Promise.promisifyAll(fs);
const logger = require('winston');
const chunk = require('lodash/array/chunk');
const each = require('lodash/collection/each');
const reduce = require('lodash/collection/reduce');
const sortBy = require('lodash/collection/sortBy');
const isUndefined = require('lodash/lang/isUndefined');

const config = require('../config');
const CollectionPage = require('./page');
const CollectionPagination = require('./pagination');

class Collection {
  constructor(name = '', collectionConfig = {}) {
    /**
     * The collection name. Must be unique.
     * @type {string}
     */
    this.name = name;

    /**
     * Path where items belong within the collection.
     * @type {string}
     */
    this.path = isUndefined(collectionConfig.path) ?
      undefined : path.resolve(config.path.source, collectionConfig.path);

    /**
     * Metadata attribute to use to find which items are within the collection.
     * @type {string}
     */
    this.metadata = isUndefined(collectionConfig.metadata) ?
      undefined : collectionConfig.metadata;

    /**
     * What layout to use when rendering an item within this collection.
     * @type {string}
     */
    this.layout = collectionConfig.layout;

    /**
     * Permalink configuration.
     * @type {string}
     */
    this.permalink = collectionConfig.permalink;

    // Ensure sort is an object.
    collectionConfig.sort = collectionConfig.sort || {};

    /**
     * Sorting configuration.
     * @type {Object}
     */
    this.sort = {
      key: collectionConfig.sort.key,
      order: collectionConfig.sort.order
    };

    /**
     * Pagination information.
     * @param {CollectionPagination}
     */
    this.pagination = new CollectionPagination(collectionConfig.pagination);

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

    /**
     * Object which holds a mapping of metadata value to the files that contain
     * the metadata property.
     * For example with metadata of 'tags' you'd have:
     * {
     * 	'tag-name': [file, file],
     * 	'other-tag': [file, file]
     * }
     * @type {Object.<string, Array.<File>>}
     */
    this.metadataFiles;

    /**
     * Array of CollectionPage objects.
     * @type {Array.<CollectionPage>}
     */
    this.pages = [];

    /**
     * Data accesible to templates.
     * @type {Object}
     */
    this.data = {};
  }

  /**
   * Set what paths to exclude from including in this collection.
   * @param {Array.<string>} excludePaths Array of paths.
   */
  setExcludePaths(excludePaths) {
    let pathIndex = excludePaths.indexOf(this.path);
    if (pathIndex > -1) {
      excludePaths.splice(pathIndex, 1);
    }

    this.excludePaths = excludePaths;
  }

  /**
   * Checks to see if this file passes all requirements to be considered a part
   * of this collection.
   * @param {File} file File object.
   * @return {boolean} true if the file meets all requirements.
   */
  isFileInCollection(file) {
    if (this.path &&
        file.path.includes(this.path) &&
        !this.isFileExcluded(file)) {
      return true;
    } else if (this.metadata &&
        !isUndefined(file.data[this.metadata])) {
      return true;
    }

    return false;
  }


  /**
   * Is this file's path included in this collections excludePaths.
   * @param {File} file File object.
   * @return {boolean} true if the file's path includes an exclude path.
   */
  isFileExcluded(file) {
    if (this.path && this.excludePaths.length) {
      return this.excludePaths.every(path => file.path.includes(path));
    } else {
      return false;
    }
  }

  /**
   * Populate the Collection's files via file system path or metadata attribute.
   * @param {Array.<Files>} files Array of files.
   * @return {Collection}
   */
  populate(files) {
    if (this.path) {
      this.files = reduce(files, (all, file) => {
        if (this.isFileInCollection(file)) {
          all.push(file);

          // Set what permalink the file should use.
          file.permalink = this.permalink;
        }

        return all;
      }, []);

      this.files = Collection.sortFiles(this.files, this.sort);

      // Add data to template accessible object.
      this.data.files = this.files.map(file => file.data);
    } else if (this.metadata) {
      // Initialize template data.
      this.data.metadata = {};

      this.metadataFiles = reduce(files, (all, file) => {
        if (!this.isFileInCollection(file)) {
          return all;
        }

        let metadataValues = file.data[this.metadata];
        if (!Array.isArray(metadataValues)) {
          metadataValues = [metadataValues];
        }

        metadataValues.forEach(value => {
          all[value] = all[value] || [];

          all[value].push(file);

          // Add data to template accessible object.
          this.data.metadata[value] = this.data.metadata[value] || [];
          this.data.metadata[value].push(file.data);
        });

        return all;
      }, {});
    }

    this.createCollectionPages();

    return this;
  }

  createCollectionPages() {
    // If no permalink paths are set then we don't render a CollectionPage.
    if (!(this.pagination.permalinkIndex || this.pagination.permalinkPage)) {
      return;
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
            // Current page number
            page: index + 1, // Make 1-indexed.

            // How many pages in the collection.
            total_pages: pages.length,

            // Posts displayed per page
            per_page: this.pagination.size,

            // Total number of posts
            total: this.files.length
          }
        );

        // Add to our array of pages.
        this.pages.push(collectionPage);
      });
    } else if (this.metadataFiles) {
      // Create CollectionPage objects to represent our pagination pages.
      each(this.metadataFiles, (files, metadataKey) => {
        // Sort files.
        files = Collection.sortFiles(files, this.sort);

        // Break up our array of files into arrays that match our defined
        // pagination size.
        let pages = chunk(files, this.pagination.size);

        pages.forEach((pageFiles, index) => {
          // Make 1-indexed.
          let pageNumber = index + 1;

          let collectionPage = new CollectionPage(
            pageFiles,
            index === 0 ?
              this.pagination.permalinkIndex :
              this.pagination.permalinkPage,
            {
              metadata: metadataKey,

              // Current page number
              page: pageNumber,

              // How many pages in the collection.
              total_pages: pages.length,

              // Posts displayed per page
              per_page: this.pagination.size,

              // Total number of posts
              total: files.length
            }
          );

          // Add to our array of pages.
          this.pages.push(collectionPage);
        });
      });
    }

    if (this.pages.length > 0) {
      this.pages.forEach((collectionPage, index) => {
        let previous = this.pages[index - 1];
        if (previous) {
          Object.assign(collectionPage.data, {
            // Previous page number. 0 if the current page is the first.
            prev: previous.data.page,

            // The URL of previous page. '' if the current page is the first.
            prev_link: previous.data.url
          });
        }

        let next = this.pages[index + 1];
        if (next) {
          Object.assign(collectionPage.data, {
            // Next page number. 0 if the current page is the last.
            next: next.data.page,

            // The URL of next page. '' if the current page is the last.
            next_link: next.data.url
          });
        }
      });
    }

    // Add data to template accessible object.
    this.data.pages = this.pages.map(page => page.data);
  }

  write(siteData) {
    let promises = [];

    // If we're writing individual files then write them.
    if (this.files) {
      this.files.forEach(file => {
        logger.info('Writing file to %s', file.destination);
        let promise = fs.outputFileAsync(
          file.destination,
          file.render(this.layout, siteData),
          'utf8'
        );

        promises.push(promise);
      });
    }

    // Write CollectionPage files.
    if (this.pages.length) {
      this.pages.forEach(collectionPage => {
        logger.info('Writing file to %s', collectionPage.destination);
        let promise = fs.outputFileAsync(
          collectionPage.destination,
          collectionPage.render(this.pagination.layout, siteData),
          'utf8'
        );

        promises.push(promise);
      });
    }

    return Promise.all(promises);
  }

  /**
   * Sorts files according to a sort config object.
   * @param {Array.<File>} files Array of File objects.
   * @param {Object} sortConfig Sort config object.
   * @return {Array.<file>} Sorted files.
   */
  static sortFiles(files, sortConfig) {
    if (sortConfig.key) {
      files = sortBy(files, sortConfig.key);

      if (sortConfig.order === 'descending') {
        files.reverse();
      }
    }

    return files;
  }
}

module.exports = Collection;