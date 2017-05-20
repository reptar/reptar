import Promise from 'bluebird';
import path from 'path';
import _ from 'lodash';
import glob from 'glob';
import Constants from './constants';
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
    // This primarily includes the Constants.ConfigFilename file as well as
    // every path directory that isn't our source path.
    const globIgnorePatterns = [
      Constants.ConfigFilename,
      'package.json',
      'node_modules',
    ]
      .concat(
        _.values(this._config.get('path')).filter(
          pathVal => pathVal !== configPathSource
        )
      )
      .map(ignorePath => `**/${ignorePath}/**`);

    // Read all files from disk and get their file paths.
    const files = await Promise.fromCallback((cb) => {
      glob(`${configPathSource}/**/*`, {
        // Do not match directories, only files.
        nodir: true,
        // Array of glob patterns to exclude from matching.
        ignore: globIgnorePatterns,
        // Follow symlinks.
        follow: true,
      }, cb);
    });

    const ignorePatterns = this._config.get('ignore');

    const filePromises = files
      // Filter out files that match our array of ignored patterns.
      .filter(rawPath =>
        // If one of our ignore patterns matches then we filter the file out.
        // This is done by asserting that .some returns false, that none pass.
        ignorePatterns.some(ignoreFn => ignoreFn(rawPath)) === false
      )
      .map((rawPath) => {
        // Correct the filePath created by glob to be compatible with Windows.
        // Known issue in node-glob
        // https://github.com/isaacs/node-glob/pull/263.
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
}
