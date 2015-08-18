const config = require('./config');
const utils = require('./utils');
const path = require('path');

class CollectionPage {
  constructor(files, permalink, metadata) {
    /**
     * Array of files in this page.
     * @type {Array.<File>}
     */
    this.files = files;

    /**
     * Metadata information about this page.
     * @type {Object}
     */
    this.metadata = metadata || {};

    /**
     * The permalink template.
     * @type {string}
     */
    this.permalink = permalink;
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
      this.metadata
    );

    /**
     * Relative destination path.
     * @type {string} relativeDestination Relative path to file.
     */
    this.destinationRelative = utils.makeUrlFileSystemSafe(relativeDestination);

    /**
     * Absolute destination path.
     * @type {string} destination Absolute path to file.
     */
    this.destination = path.join(
      config.path.destination,
      this.destinationRelative
    );
  }

  context() {
    let context = {};

    Object.assign(context, this.metadata, {
      // The URL of current page without root URL.
      url: this.destinationRelative,

      // Files within collection.
      files: this.files.map(file => file.context())
    });

    return context;
  }

  render(layout = 'default') {
    return utils.template.render(layout, {
      pagination: this.context()
    });
  }
}

module.exports = CollectionPage;
