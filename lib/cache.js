import path from 'path';
import fs from 'fs-extra';
import homeOrTmp from 'home-or-tmp';
import { createChecksum } from './checksum';
import log from './log';

let data = {};

/**
 * Namespace of the Yarn site that we're caching. This is unique for every
 * directory so we can manage cache individually for each local Yarn install.
 * @param {string}
 */
let namespace;

function createFilename(namespace = '') {
  const checksum = createChecksum(namespace).slice(0, 10);
  return path.join(homeOrTmp, `.yarn-${checksum}.json`);
}

let filename = createFilename(namespace);

const cache = {
  setNamespace(val) {
    namespace = val;

    filename = createFilename(namespace);
  },

  load() {
    process.on('exit', cache.save);

    try {
      data = JSON.parse(fs.readFileSync(filename));
    } catch (err) {
      return;
    }
  },

  save() {
    let content = {};

    // Add information about the namespace for this cache so it's
    // human readable.
    data['_namespace'] = namespace;

    try {
      content = JSON.stringify(data, null, '  ');
    } catch (err) {
      if (err.message === 'Invalid string length') {
        err.message = 'Cache too large so it\'s been cleared.';
        log.error(err.stack);
      } else {
        throw err;
      }
    }

    fs.outputFileSync(filename, content);
  },

  clear() {
    data = {};
  },

  put(cacheKey, cacheValue) {
    data[cacheKey] = cacheValue;
  },

  get(cacheKey) {
    return data[cacheKey];
  },
};

export default cache;