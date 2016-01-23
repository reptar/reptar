import assert from 'power-assert';
import path from 'path';
import isEqual from 'lodash/isEqual';
import * as json from '../../lib/json.js';

describe('json JSON', function() {

  describe('getYarnPackageNames', () => {
    it('returns the yarn package names', () => {
      let rootDir = path.resolve(__dirname, '../../');
      let plugins = json.getYarnPackageNames(rootDir);

      assert(isEqual(
        Array.from(plugins),
        ['yarn-excerpt', 'yarn-html-minifier', 'yarn-scaffold']
      ));
    });
  });
});
