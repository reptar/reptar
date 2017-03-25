import _ from 'lodash';
import path from 'path';
import Promise from 'bluebird';
import fs from 'fs-extra';
import cache from '../cache';
import createChecksum from '../checksum';
import Url from '../url';

export default class CollectionPage {
  /**
   * Constructor for a CollectionPage.
   * @param {string} collectionId Collection ID.
   * @param {number} pageIndex Page index.
   * @param {Object} options Additional options.
   * @param {Config} options.config Config instance.
   * @param {Renderer} options.renderer Renderer instance.
   * @constructor
   */
  constructor(collectionId, pageIndex, { config, renderer } = {}) {
    if (_.isUndefined(collectionId)) {
      throw new Error('CollectionPage requires a collection ID as a string.');
    }

    if (!_.isNumber(pageIndex)) {
      throw new Error('CollectionPage requires a page index.');
    }

    /**
     * Unique ID of this CollectionPage. Comprised of its Collection's ID and
     * its page index.
     * @type {string}
     */
    this.id = `${collectionId}:${pageIndex}`;

    /**
     * Collection ID this page is a part of.
     * @type {string}
     */
    this.collectionId = collectionId;

    /**
     * @type {Config}
     * @private
     */
    this._config = config;

    /**
     * @type {Renderer}
     * @private
     */
    this._renderer = renderer;

    /**
     * Page index, 0-indexed.
     * @type {number}
     */
    this.index = pageIndex;

    /**
     * An array of Files that are in this page.
     * @type {Array.<string>}
     */
    this.files = [];

    /**
     * The permalink template.
     * @type {string}
     */
    this.permalink = '';

    /**
     * Data accessible from template.
     * @type {Object}
     */
    this.data = Object.create(null);

    // Current page number, 1-indexed for display purposes.
    this.data.page = this.index + 1;
  }

  setData(data = {}) {
    // Current page number.
    if (!_.isUndefined(data.page) && !_.isNumber(data.page)) {
      throw new Error('CollectionPage requires \'page\' as a number.');
    }

    // How many pages in the collection.
    if (!_.isUndefined(data.total_pages) && !_.isNumber(data.total_pages)) {
      throw new Error('CollectionPage requires \'total_pages\' as a number.');
    }

    // Posts displayed per page.
    if (!_.isUndefined(data.per_page) && !_.isNumber(data.per_page)) {
      throw new Error('CollectionPage requires \'per_page\' as a number.');
    }

    // Total number of posts.
    if (!_.isUndefined(data.total) && !_.isNumber(data.total)) {
      throw new Error('CollectionPage requires \'total\' as a number.');
    }

    // Update content that's accessible from template.
    Object.assign(this.data, data);

    this._calculateDestination();
  }

  /**
   * Set what files belong in this page.
   * @param {Array.<File>} files Array of files.
   */
  setFiles(files) {
    if (!_.isUndefined(files) && !_.isArray(files)) {
      throw new Error('Files must be an array.');
    }

    // Save Files in this Page.
    this.files = files;

    /**
     * Array of File data in this page.
     * @type {Array.<File>}
     */
    this.data.files = files.map(file => file.data);
  }

  /**
   * Generate the checksum of this CollectionPage. It's derived from the Files
   * that exist in this collection.
   * @return {string}
   */
  getChecksum() {
    const fileChecksums = this.files.map(file => file.checksum);

    const checksum = createChecksum(fileChecksums.join(''));

    return checksum;
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
      prev_link: previous.data.url,
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
      next_link: next.data.url,
    });
  }

  /**
   * Calculate both relative and absolute destination path for where to write
   * the file.
   * @private
   */
  _calculateDestination() {
    // Calculate the permalink value.
    const relativeDestination = Url.interpolatePermalink(
      this.permalink,
      this.data
    );

    /**
     * Absolute destination path.
     * @type {string} destination Absolute path to file.
     */
    this.destination = Url.makeUrlFileSystemSafe(
      relativeDestination
    );

    /**
     * The URL without the domain, but with a leading slash,
     * e.g.  /2008/12/14/my-post.html
     * @type {string} url Relative path to file.
     */
    this.data.url = Url.makePretty(this.destination);
  }

  /**
   * Update a CollectionPage's content via updating every File's content.
   */
  async update() {
    await Promise.all(this.files.map(file => file.update()));

    this.data.files = this.files.map(file => file.data);
  }

  render(globalData) {
    const templateData = {
      ...globalData,
      pagination: this.data,
    };

    const template = this.data.template;

    if (_.isNil(template)) {
      let errMsg = 'CollectionPage: No template given.\nData object: ';
      errMsg += JSON.stringify(this.data);
      throw new Error(errMsg);
    }

    return this._renderer.renderTemplate(template, templateData);
  }

  /**
   * Writes a given CollectionPage to the file system.
   * @param {Object} globalData Site wide data.
   */
  async write(globalData) {
    const checksum = this.getChecksum();

    if (this._config.get('incremental') &&
        cache.get(this.id) === checksum) {
      return;
    }

    const content = await this.render(globalData);

    const destinationPath = path.join(
      this._config.get('path.destination'),
      this.destination
    );

    await Promise.fromCallback((cb) => {
      fs.outputFile(destinationPath, content, 'utf8', cb);
    });

    // Save checksum to cache for incremental builds.
    cache.put(this.id, checksum);
  }
}
