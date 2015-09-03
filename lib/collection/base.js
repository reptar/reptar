import Promise from 'bluebird';
import fs from 'fs-extra';
Promise.promisifyAll(fs);
import path from 'path';
import logger from 'winston'; //eslint-disable-line no-unused-vars
import isUndefined from 'lodash/lang/isUndefined';
import isNumber from 'lodash/lang/isNumber';
import sortBy from 'lodash/collection/sortBy';
import isString from 'lodash/lang/isString';

import config from '../config';
import Plugin from '../plugin';

export default class CollectionBase {
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
      let paginationConfig = collectionConfig.pagination;

      /**
       * Pagination information.
       * @param {Object}
       */
      this.pagination = {};

      if (!isUndefined(paginationConfig.layout)) {
        /**
         * What layout to use when rendering a pagination page.
         * @type {string}
         */
        this.pagination.layout = paginationConfig.layout;
      }

      if (!isUndefined(paginationConfig.size)) {
        if (!isNumber(paginationConfig.size)) {
          throw new Error('Pagination size must be a number');
        }

        /**
         * Size of each pagination page.
         * @type {number}
         */
        this.pagination.size = paginationConfig.size;
      }

      if (!isUndefined(paginationConfig.permalink_index)) {
        /**
         * Permalink pagination index configuration.
         * @type {string}
         */
        this.pagination.permalinkIndex = paginationConfig.permalink_index;
      }

      if (!isUndefined(paginationConfig.permalink_page)) {
        /**
         * Permalink pagination page configuration.
         * @type {string}
         */
        this.pagination.permalinkPage = paginationConfig.permalink_page;
      }
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

  _linkPages(shouldLinkPrevious, shouldLinkNext) {
    if (this.pages.length > 0) {
      this.pages.forEach((collectionPage, index) => {
        let previous = this.pages[index - 1];

        if (shouldLinkPrevious(previous, collectionPage)) {
          collectionPage.setPreviousPage(previous);
        }

        let next = this.pages[index + 1];

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
        promises.push(CollectionBase.renderAndWriteFile(
          file,
          this.layout,
          siteData,
          Plugin.Event.file.beforeRender,
          Plugin.Event.file.afterRender
        ));
      });
    }

    // Write CollectionPage files.
    if (this.pages.length) {
      this.pages.forEach(collectionPage => {
        promises.push(CollectionBase.renderAndWriteFile(
          collectionPage,
          this.pagination.layout,
          siteData,
          Plugin.Event.page.beforeRender,
          Plugin.Event.page.afterRender
        ));
      });
    }

    return Promise.all(promises);
  }

  /**
   * Write a file to the file system. Calls all plugin events.
   * @param {(File|CollectionPage)} file File or CollectionPage object.
   * @param {string} layout Which layout template to use.
   * @param {Object} siteData Site wide template data.
   * @param {Plugin.Event} eventBefore Which event handler to process before
   *   rendering the file.
   * @param {Plugin.Event} eventAfter Which event handler to process after
   *   rendering the file.
   * @return {Promise}
   */
  static async renderAndWriteFile(file, layout, siteData,
    eventBefore, eventAfter) {

    if (eventBefore) {
      await Plugin.processEventHandlers(eventBefore, file);
    }

    let renderedFile = file.render(layout, siteData);

    if (eventAfter) {
      renderedFile = await Plugin.processEventHandlers(
        eventAfter,
        renderedFile
      );
    }

    return CollectionBase.writeToFileSystem(
      file.destination,
      renderedFile
    );
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
