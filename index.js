var path = require('path');
var fs = require('fs');
var glob = require('glob');

const TEMP_PATH = path.resolve(__dirname, './.tmp');

function fsRead(done) {
  fs.readdir(TEMP_PATH, (err, files) => {
    if (err) {
      throw err;
    }

    var directories = files.reduce((dirs, file) => {
      let fileStat = fs.lstatSync(path.join(TEMP_PATH, file));
      if (fileStat.isDirectory()) {
        dirs.push(file);
      }

      return dirs;
    }, []);

    console.log(files, directories);

    done();
  });
}

const MarkdownFile = require('./lib/markdownFile');

class MarkdownLibrary {
  constructor(globPattern = '') {
    let files = glob.sync(globPattern);
    if (!files.length) {
      return;
    }

    this.files = files.map(file => new MarkdownFile(file));
  }

  get checksums() {
    return this.files.map(file => file.checksum);
  }
}

module.exports = function(done) {
  let markdownFiles = path.resolve(__dirname, './.tmp/posts/2015/*.md');
  let library = new MarkdownLibrary(markdownFiles);
  console.log(library.checksums);
  // let fileData = JSON.stringify(library.checksums);
  // fs.writeFileSync('./checksums.json', fileData, 'utf8');
  done();
  // fsRead(done);
};
