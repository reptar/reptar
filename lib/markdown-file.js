const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const utils = require('./utils');

class MarkdownFile {
  constructor(filePath = '') {
    this.rawContent = MarkdownFile.loadFromFs(filePath);

    this.checksum = crypto.createHash('md5')
      .update(this.rawContent, 'utf8').digest('hex');

    // Parse file.
    let parsedFile = utils.frontMatter.parse(this.rawContent);

    // Save parsed data.
    this.data = parsedFile.data;
    this.content = parsedFile.content;
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

  static loadFromFs(filePath = '') {
    this.path = path.resolve(filePath);
    return fs.readFileSync(this.path, 'utf8');
  }
}

module.exports = MarkdownFile;
