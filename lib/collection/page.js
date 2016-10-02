import _ from 'lodash';
import path from 'path';
import cache from '../cache';
import { createChecksum } from '../checksum';
import Plugin from '../plugin';
import {
  renderTemplate,
  TemplateErrorMessage,
} from '../template';
import Url from '../url';
import {
  renderAndWriteFileWithPlugins,
} from '../render';

export default class CollectionPage {
  /**
   * Constructor for a CollectionPage.
   * @param {string} collectionId Collection ID.
   * @param {number} pageIndex Page index.
   * @constructor
   */
  constructor(collectionId, pageIndex) {
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
    this._collectionId = collectionId;

    /**
     * Page index, 0-indexed.
     * @type {number}
     */
    this._index = pageIndex;

    /**
     * An array of Files that are in this page.
     * @type {Set.<string>}
     */
    this.files = new Set();

    /**
     * The permalink template.
     * @type {string}
     */
    this.permalink;

    /**
     * Data accessible from template.
     * @type {Object}
     */
    this.data = Object.create(null);

    // Current page number, 1-indexed for display purposes.
    this.data.page = this._index + 1;
  }

  setGetConfig(getConfig) {
    this._getConfig = getConfig;
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

    /**
     * Array of files in this page.
     * @type {Array.<File>}
     */
    this.data.files = files.map(file => {
      this.files.add(file);

      return file.data;
    });
  }

  /**
   * Generate the checksum of this CollectionPage. It's derived from the Files
   * that exist in this collection.
   * @return {string}
   */
  getChecksum() {
    const fileChecksums = [];
    for (const file of this.files) {
      fileChecksums.push(file.checksum);
    }
    fileChecksums.sort();

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
   * @private
   */
  _calculateDestination() {
    // Calculate the permalink value.
    const relativeDestination = Url.interpolatePermalink(
      this.permalink,
      this.data
    );

    const fileSystemSafeDestination = Url.makeUrlFileSystemSafe(
      relativeDestination
    );

    /**
     * The URL without the domain, but with a leading slash,
     * e.g.  /2008/12/14/my-post.html
     * @type {string} url Relative path to file.
     */
    this.data.url = Url.makePretty(fileSystemSafeDestination);

    /**
     * Absolute destination path.
     * @type {string} destination Absolute path to file.
     */
    this.destination = path.join(
      this._getConfig().get('path.destination'),
      fileSystemSafeDestination
    );
  }

  render(template, globalData) {
    const templateData = {
      ...globalData,
      pagination: this.data,
    };

    if (_.isNil(template)) {
      throw new Error(`CollectionPage: No template given.\nData object: ` +
        JSON.stringify(this.data));
    }

    let result;
    try {
      result = renderTemplate(template, templateData);
    } catch (e) {
      if (e.message.includes(TemplateErrorMessage.NO_TEMPLATE)) {
        throw new Error(`CollectionPage: Template not found '${template}'.\n` +
          `Data: ${JSON.stringify(this)}`);
      } else {
        throw e;
      }
    }

    return result;
  }

  /**
   * Writes a given CollectionPage to the file system.
   * @param {string} template Which template to use when rendering.
   * @param {Object} siteData Site wide data.
   * @return {Promise} Array of promises.
   */
  write(template, siteData) {
    const checksum = this.getChecksum();

    if (this._getConfig().get('incremental') &&
        cache.get(this.id) === checksum) {
      return Promise.resolve();
    }

    return renderAndWriteFileWithPlugins(
      this,
      template,
      siteData,
      Plugin.Event.page.beforeRender,
      Plugin.Event.page.afterRender
    ).then(result => {
      // Save checksum to cache for incremental builds.
      cache.put(this.id, checksum);

      return result;
    });
  }
}
