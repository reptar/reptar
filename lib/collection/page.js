import isUndefined from 'lodash/lang/isUndefined';
import isArray from 'lodash/lang/isArray';
import isNumber from 'lodash/lang/isNumber';
import path from 'path';
import config from '../config';
import Render from '../render';
import Url from '../url';

export default class CollectionPage {
  /**
   * Constructor for a CollectionPage.
   * @param {string} collectionId Collection ID.
   * @param {number} pageIndex Page index.
   * @constructor
   */
  constructor(collectionId, pageIndex) {
    if (isUndefined(collectionId)) {
      throw new Error('CollectionPage requires a collection ID as a string.');
    }

    if (!isNumber(pageIndex)) {
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

  setData(data = {}) {
    // Current page number.
    if (!isUndefined(data.page) && !isNumber(data.page)) {
      throw new Error(`CollectionPage requires 'page' as a number.`);
    }

    // How many pages in the collection.
    if (!isUndefined(data.total_pages) && !isNumber(data.total_pages)) {
      throw new Error(`CollectionPage requires 'total_pages' as a number.`);
    }

    // Posts displayed per page.
    if (!isUndefined(data.per_page) && !isNumber(data.per_page)) {
      throw new Error(`CollectionPage requires 'per_page' as a number.`);
    }

    // Total number of posts.
    if (!isUndefined(data.total) && !isNumber(data.total)) {
      throw new Error(`CollectionPage requires 'total' as a number.`);
    }

    // Total number of posts.
    if (!isUndefined(data.files) && !isArray(data.files)) {
      throw new Error(`CollectionPage requires 'files' as a number.`);
    }

    // Update content that's accessible from template.
    Object.assign(this.data, data);

    // Map just File's data.
    if (data.files) {
      /**
       * Array of files in this page.
       * @type {Array.<File>}
       */
      this.data.files = data.files.map(file => file.data);
    }

    this._calculateDestination();
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
    let relativeDestination = Url.interpolatePermalink(
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
      Url.makeUrlFileSystemSafe(this.data.url)
    );
  }

  render(template = 'default', globalData) {
    return Render.fromTemplate(template, Object.assign({}, globalData, {
      pagination: this.data
    }));
  }
}
