const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const isUndefined = require('lodash/lang/isUndefined');
const utils = require('./utils');
const config = require('./config');

class File {
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
    let parsedFile = utils.frontMatter.parse(this.rawContent);

    /**
     * File data that is accessible from template.
     * @type {Object}
     */
    this.data = parsedFile.data;

    /**
     * Just the file's text content.
     * @type {string}
     */
    this.content = parsedFile.content;

    // Update content that's accessible from template.
    Object.assign(this.data, {
      // The content of the Page.
      content: utils.markdown.render(this.content),

      // The excerpt of the Page.
      excerpt: 'excerpt goes here'
    });
  }

  /**
   * Path to file relative to root of project.
   * @type {string}
   */
  get pathRelative() {
    return this.path.replace(config.path.source, '');
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
    let relativeDestination = this.pathRelative;

    if (this.permalink) {
      relativeDestination = utils.interpolatePermalink(
        this.permalink,
        this.data
      );
    } else {
      // Get file extension of file. i.e. 'post.md' would give 'md'.
      let fileExtension = path.extname(relativeDestination).replace(/^\./, '');
      let index = config.markdown_extension.indexOf(fileExtension);
      // Is this file's extension one of our known markdown extensions?
      if (index > -1) {
        let foundExtension = config.markdown_extension[index];
        relativeDestination = relativeDestination.replace(
          new RegExp(`.${foundExtension}$`),
          '.html'
        );
      }
    }

    /**
     * The URL of the Post without the domain, but with a leading slash,
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
    return utils.template.render(
      isUndefined(this.data.template) ? template : this.data.template,
      Object.assign({}, globalData, {
        page: this.data
      }),
      this
    );
  }

}

module.exports = File;
