const path = require('path');
const config = require('../config');
const utils = require('../utils');

class CollectionPage {
  constructor(files = [], permalink = '', data = {}) {
    /**
     * Data accessible from template.
     * @type {Object}
     */
    this.data = data;

    /**
     * The permalink template.
     * @type {string}
     */
    this.permalink = permalink;

    // Update content that's accessible from template.
    Object.assign(this.data, {
      /**
       * Array of files in this page.
       * @type {Array.<File>}
       */
      files: files.map(file => file.data)
    });
  }

  /**
   * Get permalink configuration.
   * @return {string}
   */
  get permalink() {
    return this._permalink;
  }

  /**
   * Set new permalink configuration this file should use.
   * Thi salso resets the destination value cache.
   * @param {string} newPermalink New permalink.
   */
  set permalink(newPermalink) {
    this._permalink = newPermalink;
    this.calculateDestination();
  }

  /**
   * Link this page with its previus page, for use in templates.
   * @param {CollectionPage} previous CollectionPage instance.
   */
  setPreviousPage(previous) {
    Object.assign(this.data, {
      // Previous page number. 0 if the current page is the first.
      prev: previous.data.page,

      // The URL of previous page. '' if the current page is the first.
      prev_link: previous.data.url
    });
  }

  /**
  * Link this page with its next page, for use in templates.
  * @param {CollectionPage} next CollectionPage instance.
   */
  setNextPage(next) {
    Object.assign(this.data, {
      // Next page number. 0 if the current page is the last.
      next: next.data.page,

      // The URL of next page. '' if the current page is the last.
      next_link: next.data.url
    });
  }

  /**
   * Calculate both relative and absolute destination path for where to write
   * the file.
   */
  calculateDestination() {
    // Calculate the permalink value.
    let relativeDestination = utils.interpolatePermalink(
      this.permalink,
      this.data
    );

    /**
     * The URL without the domain, but with a leading slash,
     * e.g.  /2008/12/14/my-post.html
     * @type {string} url Relative path to file.
     */
    this.data.url = relativeDestination;

    /**
     * Absolute destination path.
     * @type {string} destination Absolute path to file.
     */
    this.destination = path.join(
      config.path.destination,
      utils.makeUrlFileSystemSafe(this.data.url)
    );
  }

  render(template = 'default', globalData) {
    return utils.template.render(template, Object.assign({}, globalData, {
      pagination: this.data
    }));
  }
}

module.exports = CollectionPage;
