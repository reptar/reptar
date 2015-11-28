import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import isUndefined from 'lodash/lang/isUndefined';
import merge from 'lodash/object/merge';
import Url from './url';
import Parse from './parse';
import Render from './render';
import config from './config';

export default class File {
  constructor(filePath = '') {
    /**
     * Absolute path to file location.
     * @type {string}
     */
    this.path = filePath;

    /**
     * Unique ID for this file. Right now an alias for the file's path.
     * @type {string}
     */
    this.id = this.path;

    /**
     * Template accessible data.
     * @type {Object.<string, Object>}
     */
    this.data = Object.create(null);

    /**
     * An array of collection IDs that this file belongs to.
     * @type {Set.<string>}
     */
    this.collectionIds = new Set();

    /**
     * An array of CollectionPage IDs that this file belongs to.
     * @type {Set.<string>}
     */
    this.pageIds = new Set();

    this.updateDataFromFileSystem();
  }

  updateDataFromFileSystem() {
    /**
     * Raw contents of file, directly from file system.
     * @TODO: perhaps don't keep reference to this?
     * @type {string} One long string.
     */
    this.rawContent = fs.readFileSync(this.path, 'utf8');

    /**
     * Checksum hash of rawContent, for use in seeing if file is different.
     * @example:
     * 	'50de70409f11f87b430f248daaa94d67'
     * @type {string}
     */
    this.checksum = crypto.createHash('md5')
      .update(this.rawContent, 'utf8').digest('hex');

    // Parse file's frontmatter.
    let parsedFile = Parse.fromFrontMatter(this.rawContent);

    /**
     * Just the file's text content.
     * @type {string}
     */
    this.content = parsedFile.content;

    /**
     * If the file itself wants to customize what its URL is then it will use
     * the `config.file.url_key` value of the File's frontmatter as the basis
     * for which the URL of this file should be.
     * So if you have a File with a frontmatter that has `url: /pandas/` then
     * the File's URL will be `/pandas/`.
     * @type {string?} url Relative path to file.
     */
    this.url = parsedFile.data[config.file.url_key];

    // Merge in new data that's accessible from template.
    merge(this.data, parsedFile.data, {
      // The content of the Page.
      content: Render.fromMarkdown(this.content)
    });

    this._calculateDestination();
  }

  /**
   * Path to file relative to root of project.
   * @type {string}
   */
  get pathRelative() {
    return this.path.replace(config.path.source, '');
  }

  /**
   * Set new permalink configuration this file should use.
   * @param {string} newPermalink New permalink.
   */
  setPermalink(newPermalink) {
    this.permalink = newPermalink;
    this._calculateDestination();
  }

  /**
   * Calculate both relative and absolute destination path for where to write
   * the file.
   * @private
   */
  _calculateDestination() {
    if (this.url) {
      // If the individual File defined its own unique URL that gets first
      // dibs at setting the official URL for this file.
      this.data.url = this.url;
    } else if (this.permalink) {
      // If the file has no URL but has a permalink set on it then use it to
      // find the URL of the File.
      this.data.url = Url.interpolatePermalink(
        this.permalink,
        this.data
      );
    } else {
      // If the file has no URL set and no permalink then use its relative file
      // path as its url.
      this.data.url = this.pathRelative;

      // Get file extension of file. i.e. 'post.md' would give 'md'.
      let fileExtension = path.extname(this.data.url).replace(/^\./, '');
      let index = config.markdown_extension.indexOf(fileExtension);
      // Is this file's extension one of our known markdown extensions?
      if (index > -1) {
        let foundExtension = config.markdown_extension[index];
        this.data.url = this.data.url.replace(
          new RegExp(`.${foundExtension}$`),
          '.html'
        );
      }
    }

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
    return Render.fromTemplate(
      isUndefined(this.data.template) ? template : this.data.template,
      Object.assign({}, globalData, {
        page: this.data
      }),
      this
    );
  }

}
