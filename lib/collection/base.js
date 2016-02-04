import Promise from 'bluebird';
import fs from 'fs-extra';
Promise.promisifyAll(fs);
import path from 'path';
import isUndefined from 'lodash/isUndefined';
import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import sortBy from 'lodash/sortBy';
import some from 'lodash/some';
import each from 'lodash/each';

import log from '../log';
import filter from './filter';
import Plugin from '../plugin';
import CollectionPage from './page';

export default class CollectionBase {
  /**
   * Create a Collection instance.
   * @param {string} name The name of the collection.
   * @param {Object} collectionConfig Config object from config file.
   * @param {Function} getConfig Delegate function that returns config object.
   */
  constructor(name, collectionConfig = {}, getConfig) {
    if (isString(name) === false || name.length === 0) {
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
     * Gets config.
     * @type {Function}
     */
    this._getConfig = getConfig;

    if (!isUndefined(collectionConfig.path)) {
      /**
       * Path where items belong within the collection.
       * @type {string}
       */
      this.path = path.resolve(
        this._getConfig().path.source,
        collectionConfig.path
      );
    }

    if (!isUndefined(collectionConfig.template)) {
      /**
       * What template to use when rendering an item within this collection.
       * @type {string}
       */
      this.template = collectionConfig.template;
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

      if (!isUndefined(paginationConfig.template)) {
        /**
         * What template to use when rendering a pagination page.
         * @type {string}
         */
        this.pagination.template = paginationConfig.template;
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

    if (!isUndefined(collectionConfig.filter)) {
      /**
       * What filters are applied to this collection.
       * @type {Object}
       */
      this.filter = collectionConfig.filter;
    }

    /**
     * Array of CollectionPage objects.
     * @type {Array.<CollectionPage>}
     */
    this.pages = [];
  }

  /**
   * Whether a file is being filtered by the configured filters.
   * @param {File} file File object.
   * @return {boolean} Whether this file should be filtered out.
   */
  isFiltered(file) {
    if (isUndefined(this.filter)) {
      return false;
    }

    return some(this.filter, (filterConfig, filterName) => {
      return filter[filterName](file, filterConfig);
    });
  }

  /**
   * Populate the Collection's files via file system path or metadata attribute.
   * @param {Object.<string, Files>} files All Files.
   * @param {Object.<string, CollectionBase>} collections Object of all
   *   collections.
   * @return {CollectionBase}
   */
  populate(files = {}, collections = {}) { // eslint-disable-line no-unused-vars
    return this;
  }

  /**
   * Create a CollectionPage instance.
   * @param {number} index Index of the page.
   * @param {string?} pageId Optionally give a custom ID for a CollectionPage.
   * @return {CollectionPage} CollectionPage instance.
   */
  createPage(index, pageId) {
    if (!isNumber(index)) {
      throw new Error('Must give an index when creating a CollectionPage.');
    }

    pageId = isUndefined(pageId) ? this.id : pageId;

    let page = new CollectionPage(pageId, index);
    page.setGetConfig(this._getConfig);

    page.permalink = index === 0 ?
      this.pagination.permalinkIndex :
      this.pagination.permalinkPage;

    return page;
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
   * Writes a given File object within the collection to the file system.
   * @param {File} file File instance.
   * @param {Object} siteData Site wide data.
   * @return {Promise} Promise object, resolved when file is written to disk.
   */
  writeFile(file, siteData) {
    if (isUndefined(this.template)) {
      log.warn('No template found when trying to write file in Collection ' +
        `${this.id} for ${file.id}`);
      return Promise.resolve();
    }

    return CollectionBase.renderAndWriteFile(
      file,
      this.template,
      siteData,
      Plugin.Event.file.beforeRender,
      Plugin.Event.file.afterRender
    );
  }

  /**
   * Writes a given CollectionPage object within the collection to the file
   * system.
   * @param {CollectionPage} collectionPage CollectionPage instance.
   * @param {Object} siteData Site wide data.
   * @return {Promise} Promise object, resolved when file is written to disk.
   */
  writePage(collectionPage, siteData) {
    return CollectionBase.renderAndWriteFile(
      collectionPage,
      this.pagination.template,
      siteData,
      Plugin.Event.page.beforeRender,
      Plugin.Event.page.afterRender
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
      each(this.files, file => {
        promises.push(this.writeFile(file, siteData));
      });
    }

    // Write CollectionPage files.
    if (this.pages.length) {
      this.pages.forEach(collectionPage => {
        promises.push(this.writePage(collectionPage, siteData));
      });
    }

    return Promise.all(promises);
  }

  /**
   * Write a file to the file system. Calls all plugin events.
   * @param {(File|CollectionPage)} file File or CollectionPage object.
   * @param {string} template Which template template to use.
   * @param {Object} siteData Site wide template data.
   * @param {Plugin.Event} eventBefore Which event handler to process before
   *   rendering the file.
   * @param {Plugin.Event} eventAfter Which event handler to process after
   *   rendering the file.
   * @return {Promise}
   */
  static async renderAndWriteFile(file, template, siteData,
    eventBefore, eventAfter) {

    if (eventBefore) {
      await Plugin.processEventHandlers(eventBefore, file);
    }

    let renderedFile = file.render(template, siteData);

    if (eventAfter) {
      [file, renderedFile] = await Plugin.processEventHandlers(
        eventAfter,
        file,
        renderedFile
      );
    }

    return CollectionBase.writeToFileSystem(
      file,
      renderedFile
    );
  }

  /**
   * Wrapper for writing to the file system.
   * @param {(File|CollectionPage)} file File or CollectionPage object.
   * @param {string} content Content of file.
   * @param {string} encoding What encoding to use when writing file.
   * @return {Promise}
   */
  static async writeToFileSystem(file, content, encoding = 'utf8') {
    // log.info('Writing file to %s', file.destination);

    [file, content] = await Plugin.processEventHandlers(
      Plugin.Event.collection.beforeWrite,
      file, content
    );

    let result = await fs.outputFileAsync(
      file.destination,
      content,
      encoding
    );

    await Plugin.processEventHandlers(
      Plugin.Event.collection.afterWrite,
      file, content
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
