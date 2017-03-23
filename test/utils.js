// eslint-disable-next-line import/no-extraneous-dependencies
import rewire from 'rewire';
import path from 'path';
import Promise from 'bluebird';
import glob from 'glob';

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
  return Promise.fromCallback((cb) => {
    glob(`${directory}/**/*`, {
      nodir: true,
    }, cb);
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
