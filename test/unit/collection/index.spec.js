import assert from 'assert';

import FileSystemCollection from '../../../lib/collection/type/file-system';
import MetadataCollection from '../../../lib/collection/type/metadata';
import { createCollection } from '../../../lib/collection/index';

describe('collection/index', () => {
  describe('create', () => {
    it('creates the right Collection class', () => {
      assert(createCollection('name', {}) instanceof FileSystemCollection);

      assert(
        createCollection('name', {
          metadata: 'whee',
        }) instanceof MetadataCollection
      );
    });
  });
});
