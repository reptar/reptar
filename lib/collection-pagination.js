const isUndefined = require('lodash/lang/isUndefined');

class CollectionPagination {
  constructor(paginationConfig = {}) {
    /**
     * What layout to use when rendering a pagination page.
     * @type {string}
     */
    this.layout = paginationConfig.layout;

    /**
     * Size of each pagination page.
     * @type {number}
     */
    this.size = isUndefined(paginationConfig.size) ? 6 :
      paginationConfig.size;

    /**
     * Permalink pagination index configuration.
     * @type {string}
     */
    this.permalinkIndex = paginationConfig.permalink_index;

    /**
     * Permalink pagination page configuration.
     * @type {string}
     */
    this.permalinkPage = paginationConfig.permalink_page;
  }
}

module.exports = CollectionPagination;
