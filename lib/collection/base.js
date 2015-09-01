const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const path = require('path');
const logger = require('winston');
const isUndefined = require('lodash/lang/isUndefined');
const sortBy = require('lodash/collection/sortBy');
const isString = require('lodash/lang/isString');

const config = require('../config');
const CollectionPagination = require('./pagination');
const Plugin = require('../plugin');

class CollectionBase {
  /**
   * Create a Collection instance.
   * @param {string} name The name of the collection.
   * @param {Object} collectionConfig Config object from config file.
   */
  constructor(name, collectionConfig = {}) {
    if (isString(name) === false || name.length === 0) {
      throw new Error('Collection requires a name.');
    }

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

    if (!isUndefined(collectionConfig.path)) {
      /**
       * Path where items belong within the collection.
       * @type {string}
       */
      this.path = path.resolve(config.path.source, collectionConfig.path);
    }

    if (!isUndefined(collectionConfig.layout)) {
      /**
       * What layout to use when rendering an item within this collection.
       * @type {string}
       */
      this.layout = collectionConfig.layout;
    }

    if (!isUndefined(collectionConfig.metadata)) {
      /**
       * Metadata attribute to use to find which items are within the
       * collection.
       * @type {string}
       */
      this.metadata = collectionConfig.metadata;
    }

    if (!isUndefined(collectionConfig.sort)) {
      /**
       * Sorting configuration.
       * @type {Object}
       */
      this.sort = {
        key: collectionConfig.sort.key,
        order: collectionConfig.sort.order
      };
    }

    if (!isUndefined(collectionConfig.pagination)) {
      /**
       * Pagination information.
       * @param {CollectionPagination}
       */
      this.pagination = new CollectionPagination(collectionConfig.pagination);
    }

    if (!isUndefined(collectionConfig.permalink)) {
      /**
       * Permalink configuration.
       * @type {string}
       */
      this.permalink = collectionConfig.permalink;
    }

    if (!isUndefined(collectionConfig.static)) {
      /**
       * Whether this is a static collection.
       * @type {boolean}
       */
      this.static = collectionConfig.static;
    }

    /**
     * Array of CollectionPage objects.
     * @type {Array.<CollectionPage>}
     */
    this.pages = [];
  }

  /**
   * Populate the Collection's files via file system path or metadata attribute.
   * @param {Array.<Files>} files Array of files.
   * @param {Array.<CollectionBase>} collections Array of all collections.
   * @return {CollectionBase}
   */
  populate(files = [], collections = []) { //eslint-disable-line no-unused-vars
    return this;
  }

  _linkPages() {
    if (this.pages.length > 0) {
      this.pages.forEach((collectionPage, index) => {
        let previous = this.pages[index - 1];

        let shouldLinkPrevFilePage = previous && this.files;

        // With metadata collections all pages aren't made in the same context.
        // i.e. for a tag metadata collection you'll have 3 pages with metadata
        // value of 'review', and 2 pages of value 'tutorial'. These different
        // metadata values should not be linked.
        let shouldLinkPrevMetadataPage = previous && this.metadataFiles &&
          previous.data.metadata === collectionPage.data.metadata;

        if (shouldLinkPrevFilePage || shouldLinkPrevMetadataPage) {
          Object.assign(collectionPage.data, {
            // Previous page number. 0 if the current page is the first.
            prev: previous.data.page,

            // The URL of previous page. '' if the current page is the first.
            prev_link: previous.data.url
          });
        }

        let next = this.pages[index + 1];

        let shouldLinkNextFilePage = next && this.files;

        // With metadata collections all pages aren't made in the same context.
        // i.e. for a tag metadata collection you'll have 3 pages with metadata
        // value of 'review', and 2 pages of value 'tutorial'. These different
        // metadata values should not be linked.
        let shouldLinkNextMetadataPage = next && this.metadataFiles &&
          next.data.metadata === collectionPage.data.metadata;

        if (shouldLinkNextFilePage || shouldLinkNextMetadataPage) {
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

    return this;
  }

  /**
   * Write a file to the file system. Calls all plugin events.
   * @param {File} file File object.
   * @param {Object} siteData Site wide template data.
   * @return {Promise}
   */
  async writeFile(file, siteData) {
    await Plugin.processEventHandlers(Plugin.Event.file.beforeRender, file);

    let renderedFile = file.render(this.layout, siteData);

    renderedFile = await Plugin.processEventHandlers(
      Plugin.Event.file.afterRender,
      renderedFile
    );

    return CollectionBase.writeToFileSystem(
      file.destination,
      renderedFile
    );
  }

  /**
   * Write collection page to file system. Includes plugin events.
   * @param {CollectionPage} collectionPage CollectionPage object.
   * @param {Object} siteData Site wide template data.
   * @return {Promise}
   */
  async writeCollectionPage(collectionPage, siteData) {
    await Plugin.processEventHandlers(
      Plugin.Event.page.beforeRender,
      collectionPage
    );

    let renderedFile = collectionPage.render(this.pagination.layout, siteData);

    renderedFile = await Plugin.processEventHandlers(
      Plugin.Event.page.afterRender,
      renderedFile
    );

    return CollectionBase.writeToFileSystem(
      collectionPage.destination,
      renderedFile
    );
  }

  /**
   * Writes both files and pages that are in this collection.
   * @param {Object} siteData Site wide data that is shared on all rendered
   *  files.
   * @return {Promise}
   */
  async write(siteData) {
    let promises = [];

    // If we're writing individual files then write them.
    if (this.files) {
      this.files.forEach(file => {
        promises.push(this.writeFile(file, siteData));
      });
    }

    // Write CollectionPage files.
    if (this.pages.length) {
      this.pages.forEach(collectionPage => {
        promises.push(this.writeCollectionPage(collectionPage, siteData));
      });
    }

    return Promise.all(promises);
  }

  /**
   * Wrapper for writing to the file system.
   * @param {string} path Path where we should write file.
   * @param {string} content Content of file.
   * @param {string} encoding What encoding to use when writing file.
   * @return {Promise}
   */
  static async writeToFileSystem(path, content, encoding = 'utf8') {
    // logger.info('Writing file to %s', path);

    let fileSystemFile = {
      path,
      content
    };

    await Plugin.processEventHandlers(
      Plugin.Event.collection.beforeWrite,
      fileSystemFile
    );

    let result = await fs.outputFileAsync(
      fileSystemFile.path,
      fileSystemFile.content,
      encoding
    );

    await Plugin.processEventHandlers(
      Plugin.Event.collection.afterWrite,
      fileSystemFile
    );

    return result;
  }

  /**
   * Sorts files according to a sort config object.
   * @param {Array.<File>} files Array of File objects.
   * @param {Object} sortConfig Sort config object.
   * @return {Array.<file>} Sorted files.
   */
  static sortFiles(files, sortConfig) {
    if (sortConfig && sortConfig.key) {
      files = sortBy(files, sortConfig.key);

      if (sortConfig.order === 'descending') {
        files.reverse();
      }
    }

    return files;
  }
}

module.exports = CollectionBase;
