var crypto = require('crypto');
var path = require('path');
var fs = require('fs');

class MarkdownFile {
  constructor(filePath = '') {
    this.path = path.resolve(filePath);
    this.contents = fs.readFileSync(this.path, 'utf8');
  }

  get checksum() {
    return crypto.createHash('md5').update(this.contents, 'utf8').digest('hex');
  }
}

module.exports = MarkdownFile;
