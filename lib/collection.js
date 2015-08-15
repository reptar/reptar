const path = require('path');
const fs = require('fs-extra');
const logger = require('winston');
const config = require('./config');
const CollectionPage = require('./collection-page');
const chunk = require('lodash/array/chunk');
const each = require('lodash/collection/each');
const map = require('lodash/collection/map');
const reduce = require('lodash/collection/reduce');
const sortBy = require('lodash/collection/sortBy');
const isUndefined = require('lodash/lang/isUndefined');

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

    /**
     * Size of each pagination page.
     * @type {number}
     */
    this.pageSize = isUndefined(collectionConfig.page_size) ? 6 :
      collectionConfig.page_size;

    /**
     * Permalink pagination index configuration.
     * @type {string}
     */
    this.permalinkIndex = collectionConfig.permalink_index;

    /**
     * Permalink pagination page configuration.
     * @type {string}
     */
    this.permalinkPage = collectionConfig.permalink_page;

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
        !isUndefined(file.metadata[this.metadata])) {
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
        }

        return all;
      }, []);

      if (this.sort.key) {
        this.files = sortBy(this.files, this.sort.key);

        if (this.sort.order === 'descending') {
          this.files.reverse();
        }
      }
    } else if (this.metadata) {
      this.metadataFiles = reduce(files, (all, file) => {
        if (!this.isFileInCollection(file)) {
          return all;
        }

        let metadataValues = file.metadata[this.metadata];
        if (!Array.isArray(metadataValues)) {
          metadataValues = [metadataValues];
        }

        metadataValues.forEach(value => {
          all[value] = all[value] || [];

          all[value].push(file);
        });

        return all;
      }, {});
    }

    this.createCollectionPages();

    return this;
  }

  createCollectionPages() {
    // If no permalink paths are set then we don't render a CollectionPage.
    if (!(this.permalinkIndex || this.permalinkPage)) {
      return;
    }

    if (this.files) {
      // Break up our array of files into arrays that match our defined
      // pageSize.
      let pages = chunk(this.files, this.pageSize);

      pages.forEach((pageFiles, index) => {
        let collectionPage = new CollectionPage(
          pageFiles,
          index === 0 ? this.permalinkIndex : this.permalinkPage,
          {
            page: index + 1 // Make 1-indexed.
          }
        );

        // Add to our array of pages.
        this.pages.push(collectionPage);
      });
    } else if (this.metadataFiles) {
      // Create CollectionPage objects to represent our pagination pages.
      each(this.metadataFiles, (files, metadataKey) => {
        // Break up our array of files into arrays that match our defined
        // pageSize.
        let pages = chunk(files, this.pageSize);

        pages.forEach((pageFiles, index) => {
          let collectionPage = new CollectionPage(
            pageFiles,
            index === 0 ? this.permalinkIndex : this.permalinkPage,
            {
              metadata: metadataKey,
              page: index + 1 // Make 1-indexed.
            }
          );

          // Add to our array of pages.
          this.pages.push(collectionPage);
        });
      });
    }
  }

  write() {
    // If we're writing individual files then write them.
    if (this.files) {
      map(this.files, file => {
        console.log(this.name, '::',(this.permalink));
        // console.log(file.getDestination(this.permalink));
        let writePath = file.getDestination(this.permalink);
        logger.info('Writing file to %s', writePath);
        // fs.outputFileSync(writePath, file.render(this.layout), 'utf8');
      });
    }

    // Write CollectionPage files.
    if (this.pages.length) {
      this.pages.forEach(collectionPage => {
        let writePath = collectionPage.getDestination();
        logger.info('Writing file to %s', writePath);
        // fs.outputFileSync(writePath, collectionPage.render(this.layout), 'utf8');
      });
    }

    return this;
  }
}

module.exports = Collection;
