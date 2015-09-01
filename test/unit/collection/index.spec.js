const assert = require('chai').assert;

const FileSystemCollection = require(
  '../../../lib/collection/type/file-system.js'
);
const MetadataCollection = require('../../../lib/collection/type/metadata.js');
const StaticCollection = require('../../../lib/collection/type/static.js');
const Collection = require('../../../lib/collection/index.js');

describe('collection/index CollectionBase', () => {

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