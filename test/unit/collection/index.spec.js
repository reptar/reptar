import assert from 'power-assert';

import FileSystemCollection from
  '../../../lib/collection/type/file-system.js';
import MetadataCollection from '../../../lib/collection/type/metadata.js';
import {
  createCollection,
} from '../../../lib/collection/index.js';

describe('collection/index', () => {

  describe('create', () => {
    it('creates the right Collection class', () => {
      assert(createCollection('name', {
      }) instanceof FileSystemCollection);

      assert(createCollection('name', {
        metadata: 'whee'
      }) instanceof MetadataCollection);
    });
  });
});