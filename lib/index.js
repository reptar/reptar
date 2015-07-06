const path = require('path');
const fs = require('fs-extra');
const logger = require('winston');
const Config = require('./config');
const utils = require('./utils');
const glob = require('glob');
const MarkdownFile = require('./markdown-file');


class Whee {
  constructor() {
    this.config = new Config();
  }

  loadConfig(configDir) {
    let localConfigPath = path.resolve(configDir, '_config.yml');
    let localConfig = '';
    try {
      localConfig = fs.readFileSync(localConfigPath, 'utf8');
    } catch (e) {
      logger.warn('Unable to load local config.yml file.');
    }

    let newConfig = utils.yaml.parse(localConfig);

    this.config.update(newConfig);
  }

  readFiles() {
    let files = glob.sync(this.config.path.posts + '/**/*.md');
    if (!files.length) {
      return;
    }

    this.files = files.map(file => new MarkdownFile(file));

    this.checksums = this.files.map(file => file.checksum);

    // console.log(this.checksums);
  }

  writeFiles() {
    this.files.map(file => {
      let permalink = utils.interpolatePermalink(
        this.config.permalink,
        file.data
      );

      let safePermalink = utils.makeUrlFileSystemSafe(permalink);

      let writePath = path.join(this.config.path.destination, safePermalink);

      logger.info('Writing file to %s', writePath);
      // fs.outputFileSync(writePath, file.render(), 'utf8');
    });
  }
}

module.exports = Whee;
