import assert from 'power-assert';

import FileSystemCollection from
  '../../../lib/collection/type/file-system.js';
import MetadataCollection from '../../../lib/collection/type/metadata.js';
import StaticCollection from '../../../lib/collection/type/static.js';
import * as Collection from '../../../lib/collection/index.js';

describe('collection/index', () => {

  describe('create', () => {
    it('creates the right Collection class', () => {
      assert(Collection.create('name', {}) instanceof FileSystemCollection);

      assert(Collection.create('name', {
        metadata: 'whee'
      }) instanceof MetadataCollection);

      assert(Collection.create('name', {
        static: true
      }) instanceof StaticCollection);
    });
  });
});