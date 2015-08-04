const path = require('path');
const fs = require('fs-extra');
const logger = require('winston');
const config = require('./config');
const utils = require('./utils');
const glob = require('glob');
const MarkdownFile = require('./markdown-file');


class Yarn {
  constructor() {
    // Subscribe to when config is updated.
    config.on(config.EVENTS.CONFIG_UPDATED, this.configUpdated.bind(this));

    // Kick off leading config update.
    this.configUpdated();
  }

  configUpdated() {
    // Configure template engine.
    utils.template.configure([
      config.theme.path.layouts,
      config.theme.path.includes
    ]);

    // Configure markdown engine.
    utils.markdown.configure(config.remarkable);
  }

  readFiles() {
    let files = glob.sync(config.path.source + '/**/*', {
      nodir: true
    });

    if (!files.length) {
      return;
    }

    this.files = files.reduce((filteredFiles, file) => {
      if (file.includes(config.path.posts) ||
          !file.includes(config.path.source + '/_')) {
        filteredFiles.push(new MarkdownFile(file));
      }
      return filteredFiles;
    }, []);


    this.checksums = this.files.map(file => file.checksum);

    // console.log(this.checksums);
  }

  writeFiles() {
    this.files.map(file => {
      let filePath = file.relativePath;

      if (file.absolutePath.includes(config.path.posts)) {
        let permalink = utils.interpolatePermalink(
          config.permalink,
          file.data
        );

        filePath = utils.makeUrlFileSystemSafe(permalink);
      }

      let writePath = path.join(config.path.destination, filePath);

      logger.info('Writing file to %s', writePath);
      // fs.outputFileSync(writePath, file.render(), 'utf8');
    });
  }
}

module.exports = Yarn;
