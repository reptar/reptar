import Promise from 'bluebird';
import path from 'path';
import moment from 'moment';
import _ from 'lodash';

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

    if (!_.isUndefined(collectionConfig.metadata)) {
      /**
       * Metadata attribute to use to find which items are within the
       * collection.
       * @type {string}
       */
      this.metadata = collectionConfig.metadata;
    }

    if (!_.isUndefined(collectionConfig.template)) {
      /**
        * What template to use when rendering a CollectionPage.
       * @type {string}
       */
      this.template = collectionConfig.template;
    }

    if (!_.isUndefined(collectionConfig.page_size)) {
      if (!_.isNumber(collectionConfig.page_size)) {
        throw new Error('Page size must be a number');
      }

      /**
       * Size of each CollectionPage.
       * @type {number}
       */
      this.pageSize = collectionConfig.page_size;
    }

    if (!_.isUndefined(collectionConfig.sort)) {
      /**
       * Sorting configuration.
       * @type {Object}
       */
      this.sort = {
        key: collectionConfig.sort.key,
        order: collectionConfig.sort.order,
      };
    }

    if (!_.isUndefined(collectionConfig.permalink)) {
      const permalinkConfig = collectionConfig.permalink;

      /**
       * Permalink information.
       * @type {Object}
       */
      this.permalink = {};

      if (!_.isUndefined(permalinkConfig.index)) {
        /**
         * Permalink index configuration.
         * @type {string}
         */
        this.permalink.index = permalinkConfig.index;
      }

      if (!_.isUndefined(permalinkConfig.page)) {
        /**
         * Permalink page configuration.
         * @type {string}
         */
        this.permalink.page = permalinkConfig.page;
      }
    }

    /**
     * Array of CollectionPage objects.
     * @type {Array.<CollectionPage>}
     */
    this.pages = [];
  }

  /**
   * Whether a File is filtered by the configured filters.
   * @param {File} file File object.
   * @return {boolean} Whether this file should be filtered out.
   */
  isFiltered(file) { // eslint-disable-line class-methods-use-this
    return file.filtered === true;
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
   * @param {string?} pageIdArg Optional custom ID for a CollectionPage.
   * @return {CollectionPage} CollectionPage instance.
   */
  createPage(index, pageIdArg) {
    if (!_.isNumber(index)) {
      throw new Error('Must give an index when creating a CollectionPage.');
    }

    const pageId = _.isUndefined(pageIdArg) ? this.id : pageIdArg;

    const page = new CollectionPage(pageId, index);
    page.setGetConfig(this._getConfig);

    page.permalink = index === 0 ?
      this.permalink.index :
      this.permalink.page;

    // Give each CollectionPage what template it should use.
    page.data.template = this.template;

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
      pagePromises = this.pages.map(collectionPage =>
        collectionPage.write(siteData)
      );
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
      const getFileDateTime = file =>
         moment(file.data[sortConfig.key], dateFormat)
          .toDate()
          .getTime();

      // Quick sniff to see if the sort value is a date object.
      const sortIsDate = getFileDateTime(files[0]) > 0;

      // eslint-disable-next-line no-param-reassign
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
