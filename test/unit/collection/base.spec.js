import assert from 'power-assert';
import sinon from 'sinon';
import isUndefined from 'lodash/isUndefined';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';

import fixture from '../../fixture';

import Plugin from '../../../lib/plugin/index.js';

import CollectionBase from '../../../lib/collection/base.js';

describe('collection/base CollectionBase', () => {

  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    Plugin._reset();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('throws when no collection name is given', () => {
      assert.throws(() => {
        new CollectionBase();
      }, /requires a name/);

      assert.throws(() => {
        new CollectionBase('');
      }, /requires a name/);
    });

    it('accepts a name and no config object', () => {
      let instance = new CollectionBase('name');

      assert.equal(instance.name, 'name');
      assert(isUndefined(instance.path));
      assert(isUndefined(instance.metadata));
      assert(isUndefined(instance.template));
      assert(isUndefined(instance.permalink));
      assert(isUndefined(instance.static));
      assert(isUndefined(instance.staticDestination));
      assert(isUndefined(instance.sort));
      assert(isUndefined(instance.pagination));
      assert(isUndefined(instance.files));
      assert(isUndefined(instance.excludePaths));
      assert(isUndefined(instance.metadataFiles));
      assert(isArray(instance.pages));
      assert.equal(instance.pages.length, 0);
      assert(isObject(instance.data));
    });
  });

  describe('isFiltered', () => {
    it('returns if a file in collection is filtered', () => {
      let instance = new CollectionBase('name');
      let file = {
        data: {}
      };

      assert.equal(instance.isFiltered(file), false);

      instance.filter = {
        metadata: {
          draft: true
        }
      };

      assert.equal(instance.isFiltered(file), false);

      file.data.draft = true;

      assert.equal(instance.isFiltered(file), true);

      instance.filter = {
        metadata: {
          draft: true
        },
        future_date: undefined
      };

      assert.equal(instance.isFiltered(file), true);

      file.data.date = Date.now() + 5000;

      assert.equal(instance.isFiltered(file), true);

      file.data.draft = false;

      assert.equal(instance.isFiltered(file), true);

      instance.filter = {};

      assert.equal(instance.isFiltered(file), false);
    });
  });

  describe('sortFiles', () => {
    it('sorts files according to config', () => {
      assert.ok(true);
      let files = fixture.collectionFiles();
      let sortConfig = {
        key: 'id',
        order: 'descending'
      };

      assert.deepEqual(
        CollectionBase.sortFiles(files, sortConfig),
        [files[0], files[2], files[1]]
      );

      sortConfig.order = '';

      assert.deepEqual(
        CollectionBase.sortFiles(files, sortConfig),
        [files[1], files[2], files[0]]
      );
    });
  });
});
