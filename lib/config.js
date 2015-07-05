const path = require('path');
const fs = require('fs');
const utils = require('./utils');
const merge = require('lodash/object/merge');

class Config {
  constructor() {
    /**
     * Full path to where we're running our app from.
     * @type {string} Full path.
     * @private
     */
    this._root = path.resolve(process.cwd());
  }

  update(config = {}) {
    // Store config data on this.
    merge(this, Config.defaultConfig(), config);

    this._absPath = null;

    // Configure template engine.
    utils.template.configure([
      this.absPath.layouts
    ]);

    // Configure markdown engine.
    utils.markdown.configure(this.remarkable);
  }

  /**
   * Lazily create the absolute path value for every path property in the YAML
   * file.
   * @return {Object} Path object of absolute paths.
   */
  get absPath() {
    if (!this._absPath && this.path) {
      this._absPath = Object.keys(this.path).reduce((absPath, pathKey) => {
        var pathVal = this.path[pathKey];
        if (pathVal) {
          // Calculate full path to YAML path property, relative to cwd and
          // then the source value.
          absPath[pathKey] = path.resolve(
            this._root,
            this.path.source,
            pathVal
          );
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
