import isNumber from 'lodash/lang/isNumber';
import path from 'path';
import config from '../config';
import Render from '../render';
import Url from '../url';

export default class CollectionPage {
  constructor(files = [], permalink = '', data = {}) {
    // Current page number
    if (!isNumber(data.page)) {
      throw new Error(`CollectionPage requires 'page' as a number.`);
    }

    // How many pages in the collection.
    if (!isNumber(data.total_pages)) {
      throw new Error(`CollectionPage requires 'total_pages' as a number.`);
    }

    // Posts displayed per page
    if (!isNumber(data.per_page)) {
      throw new Error(`CollectionPage requires 'per_page' as a number.`);
    }

    // Total number of posts
    if (!isNumber(data.total)) {
      throw new Error(`CollectionPage requires 'total' as a number.`);
    }

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
