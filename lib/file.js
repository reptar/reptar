const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
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
     * Frontmatter metadata.
     * @type {Object}
     */
    this.metadata = parsedFile.data;

    /**
     * Just the file's text content.
     * @type {string}
     */
    this.content = parsedFile.content;
  }

  /**
   * Path to file relative to root of project.
   * @type {string}
   */
  get pathRelative() {
    return this.path.replace(config.path.source, '');
  }

  /**
   * Destination path for where to write the file.
   * @param {string} permalink Permalink structure to use.
   * @return {string} Destination path.
   */
  getDestination(permalink = '') {
    let relativeDestination = this.pathRelative;

    if (permalink) {
      relativeDestination = utils.interpolatePermalink(
        permalink,
        this.metadata
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

    relativeDestination = utils.makeUrlFileSystemSafe(relativeDestination);

    return path.join(config.path.destination, relativeDestination);
  }

  context() {
    let context = {
      page: {}
    };

    Object.assign(context.page, this.metadata, {
      content: utils.markdown.render(this.content)
    });

    return context;
  }

  render(layout = 'default') {
    return utils.template.render(layout, this.context());
  }

}

module.exports = File;
