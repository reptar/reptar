import Promise from 'bluebird';
import fs from 'fs-extra';
Promise.promisifyAll(fs);
import path from 'path';
import moment from 'moment';
import _ from 'lodash';

import filter from './filter';
import CollectionPage from './page';

export default class CollectionBase {
  /**
   * Create a Collection instance.
   * @param {string} name The name of the collection.
   * @param {Object} collectionConfig Config object from config file.
   * @param {Function} getConfig Delegate function that returns config object.
   */
  constructor(name, collectionConfig = {}, getConfig) {
    if (_.isString(name) === false || name.length === 0) {
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

    if (!_.isUndefined(collectionConfig.path)) {
      /**
       * Path where items belong within the collection.
       * @type {string}
       */
      this.path = path.resolve(
        this._getConfig().get('path.source'),
        collectionConfig.path
      );
    }

    if (!_.isUndefined(collectionConfig.template)) {
      /**
       * What template to use when rendering an item within this collection.
       * @type {string}
       */
      this.template = collectionConfig.template;
    }

    if (!_.isUndefined(collectionConfig.metadata)) {
      /**
       * Metadata attribute to use to find which items are within the
       * collection.
       * @type {string}
       */
      this.metadata = collectionConfig.metadata;
    }

    if (!_.isUndefined(collectionConfig.sort)) {
      /**
       * Sorting configuration.
       * @type {Object}
       */
      this.sort = {
        key: collectionConfig.sort.key,
        order: collectionConfig.sort.order
      };
    }

    if (!_.isUndefined(collectionConfig.pagination)) {
      const paginationConfig = collectionConfig.pagination;

      /**
       * Pagination information.
       * @param {Object}
       */
      this.pagination = {};

      if (!_.isUndefined(paginationConfig.template)) {
        /**
         * What template to use when rendering a pagination page.
         * @type {string}
         */
        this.pagination.template = paginationConfig.template;
      }

      if (!_.isUndefined(paginationConfig.size)) {
        if (!_.isNumber(paginationConfig.size)) {
          throw new Error('Pagination size must be a number');
        }

        /**
         * Size of each pagination page.
         * @type {number}
         */
        this.pagination.size = paginationConfig.size;
      }

      if (!_.isUndefined(paginationConfig.permalink_index)) {
        /**
         * Permalink pagination index configuration.
         * @type {string}
         */
        this.pagination.permalinkIndex = paginationConfig.permalink_index;
      }

      if (!_.isUndefined(paginationConfig.permalink_page)) {
        /**
         * Permalink pagination page configuration.
         * @type {string}
         */
        this.pagination.permalinkPage = paginationConfig.permalink_page;
      }
    }

    if (!_.isUndefined(collectionConfig.permalink)) {
      /**
       * Permalink configuration.
       * @type {string}
       */
      this.permalink = collectionConfig.permalink;
    }

    if (!_.isUndefined(collectionConfig.filter)) {
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
    if (_.isUndefined(this.filter)) {
      return false;
    }

    return _.some(this.filter, (filterConfig, filterName) => {
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
    if (!_.isNumber(index)) {
      throw new Error('Must give an index when creating a CollectionPage.');
    }

    pageId = _.isUndefined(pageId) ? this.id : pageId;

    const page = new CollectionPage(pageId, index);
    page.setGetConfig(this._getConfig);

    page.permalink = index === 0 ?
      this.pagination.permalinkIndex :
      this.pagination.permalinkPage;

    // Give each CollectionPage what template it should use.
    page.data.template = this.pagination.template;

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
      pagePromises = this.pages.map(collectionPage => {
        return collectionPage.write(siteData);
      });
    }

    return Promise.all(pagePromises);
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
      const getFileDateTime = (file) => {
        return moment(file.data[sortConfig.key], dateFormat).toDate().getTime();
      };

      // Quick sniff to see if the sort value is a date object.
      const sortIsDate = getFileDateTime(files[0]) > 0;

      files = _.sortBy(files, sortIsDate ?
        getFileDateTime :
        `data[${sortConfig.key}]`
      );

      if (sortConfig.order === 'descending') {
        files.reverse();
      }
    }

    return files;
  }
}
