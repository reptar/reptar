import path from 'path';
import _ from 'lodash';
import Promise from 'bluebird';
import glob from 'glob';
import Parse from '../parse';

/**
 * Load all files in the given dataPath file and parse them into a JS object.
 * Then depending on the directory path structure and the name of the file
 * set the files contents in that path on an object.
 * @param {string} dataPath Path to data files.
 * @return {Object}
 */
export async function readDataFiles(dataPath = '') {
  // Read all files from disk and get their file paths.
  const filePaths = await Promise.fromCallback((cb) => {
    glob(`${dataPath}/**/*.{json,yml,yaml}`, {
      // Do not match directories, only files.
      nodir: true,
      // Follow symlinks.
      follow: true,
    }, cb);
  }).map(filePath =>
    // Correct the filePath created by glob to be compatible with Windows.
    // Known issue in node-glob https://github.com/isaacs/node-glob/pull/263.
    // eslint-disable-next-line no-useless-escape
    path.normalize(filePath.replace(/[\\\/]/g, path.sep))
  );

  const files = filePaths.map(filePath => ({
    filePath,
    // Load and parse file's contents.
    content: Parse.smartLoadAndParse(filePath),
    // Create the path where we'll set the file's contents.
    // This turns something like
    // /Users/user/reptar/_data/friends/angelica.json
    // into
    // ['friends', 'angelica']
    // So we can use it with _.set.
    dataPath: path.relative(
      dataPath,
      path.join(
        path.dirname(filePath),
        path.basename(filePath, path.extname(filePath))
      )
    ).split(path.sep),
  }));

  return files.reduce((acc, file) =>
    // Set file's contents on the corresponding path.
    _.set(acc, file.dataPath, file.content),
    {}
  );
}

export default async function dataFilesMiddleware(reptar) {
  // Read data files.
  const dataFiles = await readDataFiles(reptar.config.get('path.data'));

  // Expose it on the site object.
  reptar.metadata.set('site.data', dataFiles);
}
