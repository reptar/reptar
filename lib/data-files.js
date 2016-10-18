import path from 'path';
import _ from 'lodash';
import Promise from 'bluebird';
import glob from 'glob';
import Parse from './parse';

export default {
  /**
   * Load all files in the given dataPath file and parse them into a JS object.
   * Then depending on the directory path structure and the name of the file
   * set the files contents in that path on an object.
   * @param {string} dataPath Path to data files.
   * @return {Object}
   */
  async update(dataPath = '') {
    // Read all files from disk and get their file paths.
    const filePaths = await Promise.fromCallback(cb => {
      glob(dataPath + '/**/*.{json,yml,yaml}', {
        // Do not match directories, only files.
        nodir: true,
        // Follow symlinks.
        follow: true
      }, cb);
    });

    const files = filePaths.map(filePath => ({
      filePath,
      // Load and parse file's contents.
      content: Parse.smartLoadAndParse(filePath),
      // Create the path where we'll set the file's contents.
      dataPath: filePath
        // Make the path relative, removing the dataPath base.
        .replace(dataPath, '')
        // Remove the file extension.
        .replace(path.extname(filePath), '')
        // Get rid of any first '\' or '/' characters. This prevents us from
        // creating a dataPath like '.foo.bar'. It removes the leading '.'.
        .replace(/^[\\\/]/, '')
        // Replace all / or \ characters with '.' for use when setting path.
        .replace(/[\\\/]/g, '.'),
    }));

    return files.reduce((acc, file) =>
      // Set file's contents on the corresponding path.
      _.set(acc, file.dataPath, file.content),
      {}
    );
  }
};
