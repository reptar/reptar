const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const utils = require('./utils');
const config = require('./config');

class MarkdownFile {
  constructor(filePath = '') {

    /**
     * Absolute path to file location.
     * @type {string}
     */
    this.absolutePath = filePath;

    /**
     * Raw contents of file, directly from file system.
     * @TODO: perhaps don't keep reference to this?
     * @type {string} One long string.
     */
    this.rawContent = fs.readFileSync(this.absolutePath, 'utf8');

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

    // Save parsed data.
    /**
     * Frontmatter data.
     * @type {Object}
     */
    this.data = parsedFile.data;

    this.content = parsedFile.content;
  }

  /**
   * Path to file relative to root of project.
   * @type {string}
   */
  get relativePath() {
    return this.absolutePath.replace(config.path.source, '');
  }

  context() {
    let context = {
      page: {}
    };

    Object.assign(context.page, this.data, {
      content: utils.markdown.render(this.content)
    });

    return context;
  }

  render() {
    return utils.template.render('post', this.context());
  }

}

module.exports = MarkdownFile;
