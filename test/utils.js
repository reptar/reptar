/* eslint-disable import/no-extraneous-dependencies */
import path from 'path';
import rewire from 'rewire';
import klaw from 'klaw';

const ConfigRewire = rewire('../lib/config/index.js');
const Config = ConfigRewire.default;

export function createMockConfig(config = {}) {
  ConfigRewire.__set__('loadConfigFile', () => config);
  const instance = new Config('');
  instance.update();
  return instance;
}

/**
 * Recursively walk a directory and return all file paths found inside.
 * @param {string} directory Absolute directory path.
 * @return {Array.<string>}
 */
export function getAllFilePaths(directory) {
  const filePaths = [];

  return new Promise((resolve) => {
    klaw(directory)
      .on('data', (item) => {
        if (item.stats.isFile()) {
          filePaths.push(item.path);
        }
      })
      .on('end', () => {
        resolve(filePaths);
      });
  });
}

/**
 * Path to simple site fixture.
 * @type {Object}
 */
export const simpleSite = {
  src: path.join(__dirname, 'fixtures/simple-site/src'),
  expected: path.join(__dirname, 'fixtures/simple-site/expected'),
};
