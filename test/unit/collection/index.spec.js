import {assert} from 'chai';

import FileSystemCollection from
  '../../../lib/collection/type/file-system.js';
import MetadataCollection from '../../../lib/collection/type/metadata.js';
import StaticCollection from '../../../lib/collection/type/static.js';
import * as Collection from '../../../lib/collection/index.js';

describe('collection/index', () => {

  describe('create', () => {
    it('creates the right Collection class', () => {
      assert.instanceOf(Collection.create('name', {}), FileSystemCollection);

      assert.instanceOf(Collection.create('name', {
        metadata: 'whee'
      }), MetadataCollection);

      assert.instanceOf(Collection.create('name', {
        static: true
      }), StaticCollection);
    });
  });
});