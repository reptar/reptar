const path = require('path');
const fs = require('fs');
const utils = require('./utils');
const _ = require('lodash');


class Config {
  constructor() {
    this._root = path.resolve(process.cwd());
  }

  update(config = {}) {
    // Store config data on this.
    _.merge(this, Config.defaultConfig(), config);

    this._absPath = null;

    // Configure template engine.
    utils.template.configure(this.absPath.templates);

    // Configure markdown engine.
    utils.markdown.configure(this.remarkable);
  }

  get absPath() {
    if (!this._absPath && this.path) {
      this._absPath = Object.keys(this.path).reduce((absPath, pathKey) => {
        var pathVal = this.path[pathKey];
        if (pathVal) {
          absPath[pathKey] = path.resolve(this._root, pathVal);
        }

        return absPath;
      }, {});
    }

    return this._absPath || {};
  }

  pathTo(dir) {
    return path.resolve(this._root, '..', dir);
  }

  static defaultConfig() {
    return utils.yaml.parse(
      fs.readFileSync(path.resolve(__dirname, 'config_defaults.yml'), 'utf8')
    );
  }
}

module.exports = Config;
