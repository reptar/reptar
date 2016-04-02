import path from 'path';
import fs from 'fs-extra';
import homeOrTmp from 'home-or-tmp';
import log from './log';

const FILENAME = path.join(homeOrTmp, '.yarn.json');

let data = {};

const cache = {
  load() {
    process.on('exit', cache.save);
    process.nextTick(cache.save);

    try {
      data = JSON.parse(fs.readFileSync(FILENAME));
    } catch (err) {
      return;
    }
  },

  save() {
    let serialised = {};
    try {
      serialised = JSON.stringify(data, null, '  ');
    } catch (err) {
      if (err.message === 'Invalid string length') {
        err.message = 'Cache too large so it\'s been cleared.';
        log.error(err.stack);
      } else {
        throw err;
      }
    }

    fs.outputFileSync(FILENAME, serialised);
  },

  put(cacheKey, cacheValue) {
    data[cacheKey] = cacheValue;
  },

  get(cacheKey) {
    return data[cacheKey];
  },
};

export default cache;