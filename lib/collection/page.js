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
    this.data.url = utils.makeUrlFileSystemSafe(relativeDestination);

    /**
     * Absolute destination path.
     * @type {string} destination Absolute path to file.
     */
    this.destination = path.join(
      config.path.destination,
      this.data.url
    );
  }

  render(template = 'default', globalData) {
    return utils.template.render(template, Object.assign({}, globalData, {
      pagination: this.data
    }));
  }
}

module.exports = CollectionPage;
