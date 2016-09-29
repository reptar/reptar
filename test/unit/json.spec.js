import assert from 'power-assert';
import path from 'path';
import _ from 'lodash';
import * as json from '../../lib/json.js';

describe('json JSON', function() {

  describe('getYarnPackageNames', () => {
    it('returns the yarn package names', () => {
      let rootDir = path.resolve(__dirname, '../../');
      let plugins = json.getYarnPackageNames(rootDir);

      assert(_.isEqual(
        Array.from(plugins),
        ['yarn-excerpt', 'yarn-html-minifier', 'yarn-scaffold']
      ));
    });
  });
});
