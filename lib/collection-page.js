const config = require('./config');
const utils = require('./utils');
const path = require('path');


class CollectionPage {
  constructor(metadata, files, page, permalink) {
    /**
     * Metadata value for page.
     * @type {string}
     */
    this.metadata = metadata;

    /**
     * Array of files in this page.
     * @type {Array.<File>}
     */
    this.files = files;

    /**
     * Which page we're on.
     * @type {number}
     */
    this.page = page;

    /**
     * The permalink template.
     * @type {string}
     */
    this.permalink = permalink;

    // Calculate the permalink value.
    let relativeDestination = utils.interpolatePermalink(
      this.permalink,
      {
        metadata: metadata,
        page: page
      }
    );

    relativeDestination = utils.makeUrlFileSystemSafe(relativeDestination);

    /**
     * The absolute destination write path.
     * @type {string}
     */
    this.destination = path.join(config.path.destination, relativeDestination);
  }

  context() {
    return {
      metadata: this.metadata,
      page: this.page,
      files: this.files,
    };
  }

  render() {
    return utils.template.render('tag', this.context());
  }
}

module.exports = CollectionPage;
