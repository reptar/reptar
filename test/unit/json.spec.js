import assert from 'power-assert';
import path from 'path';
import _ from 'lodash';
import * as json from '../../lib/json.js';

describe('json JSON', function() {

  describe('getReptarPackageNames', () => {
    it('returns the Reptar package names', () => {
      const rootDir = path.resolve(__dirname, '../../');
      const plugins = json.getReptarPackageNames(rootDir);

      assert(_.isEqual(
        Array.from(plugins),
        ['reptar-excerpt', 'reptar-html-minifier']
      ));
    });
  });
});
