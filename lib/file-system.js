import Promise from 'bluebird';
import path from 'path';
import _ from 'lodash';
import glob from 'glob';
import * as CONSTANTS from './constants';
import File from './file';

export default class FileSystem {
  constructor({ config, renderer } = {}) {
    /**
     * @type {Config}
     * @private
     */
    this._config = config;

    /**
     * @type {Renderer}
     * @private
     */
    this._renderer = renderer;

    /**
     * All files found in our source path.
     * Key is the full path to the file, value is the actual File object.
     * @type {Object.<string, File>}
     */
    this.files = Object.create(null);
  }

  async loadIntoMemory() {
    const configPathSource = this._config.get('path.source');

    // Create an array of patterns that we should ignore when reading the source
    // files of the Reptar site from disk.
    // This primarily includes the '_config.yml' file as well as every path
    // directory that isn't our source path, primarily '_site', '_plugins',
    // and '_themes'.
    const ignorePatterns = _.values(CONSTANTS.YAML).concat(
      _.values(this._config.get('path')).filter(pathVal =>
        pathVal !== configPathSource
      )
    );

    // Ignore package.json file as well.
    ignorePatterns.push('package.json');

    // Read all files from disk and get their file paths.
    const files = await Promise.fromCallback((cb) => {
      glob(`${configPathSource}/**/*`, {
        // Do not match directories, only files.
        nodir: true,
        // Array of glob patterns to exclude from matching.
        ignore: ignorePatterns.map(ignorePath => `**/${ignorePath}/**`).concat(
          `${configPathSource}/node_modules/**`
        ),
        // Follow symlinks.
        follow: true,
      }, cb);
    });

    const filePromises = files.map((rawPath) => {
      // Correct the filePath created by glob to be compatible with Windows.
      // Known issue in node-glob https://github.com/isaacs/node-glob/pull/263.
      const filePath = path.normalize(rawPath.replace(/\//g, path.sep));

      const sourceFile = new File(filePath, {
        config: this._config,
        renderer: this._renderer,
      });
      this.files[sourceFile.id] = sourceFile;

      return sourceFile.update();
    });

    return Promise.all(filePromises);
  }

  async writeToDisk(data) {
    return Promise.all(
      _.map(this.files, file => file.write(data))
    );
  }
}
