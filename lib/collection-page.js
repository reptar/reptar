const config = require('./config');
const utils = require('./utils');
const path = require('path');

class CollectionPage {
  constructor(files, permalink, context) {
    /**
     * Array of files in this page.
     * @type {Array.<File>}
     */
    this.files = files;

    /**
     * The permalink template.
     * @type {string}
     */
    this.permalink = permalink;

    /**
     * Cached context information used to create the proper permalink.
     * @type {Object}
     */
    this._context = context || {};
  }

  /**
   * Destination path for where to write the file.
   * @param {string} permalink Permalink structure to use.
   * @return {string} Destination path.
   */
  getDestination(permalink = this.permalink) {
    // Calculate the permalink value.
    let relativeDestination = utils.interpolatePermalink(
      permalink,
      this.context()
    );

    relativeDestination = utils.makeUrlFileSystemSafe(relativeDestination);

    return path.join(config.path.destination, relativeDestination);
  }

  context() {
    return this._context;
  }

  render(layout = 'default') {
    return utils.template.render(layout, this.context());
  }
}

module.exports = CollectionPage;
