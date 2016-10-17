import assert from 'power-assert';
import sinon from 'sinon';
import _ from 'lodash';

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
      const instance = new CollectionBase('name');

      assert.equal(instance.name, 'name');
      assert(_.isUndefined(instance.path));
      assert(_.isUndefined(instance.metadata));
      assert(_.isUndefined(instance.template));
      assert(_.isUndefined(instance.permalink));
      assert(_.isUndefined(instance.sort));
      assert(_.isUndefined(instance.pagination));
      assert(_.isUndefined(instance.files));
      assert(_.isUndefined(instance.excludePaths));
      assert(_.isUndefined(instance.metadataFiles));
      assert(_.isArray(instance.pages));
      assert.equal(instance.pages.length, 0);
      assert(_.isObject(instance.data));
    });
  });

  describe('isFiltered', () => {
    it('returns if a file in collection is filtered', () => {
      const instance = new CollectionBase('name');
      const file = {
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
    let files;

    const additionalData = [
      {
        number: 10,
        date: '2017-3-28',
      },
      {
        number: 1,
        date: '2013-9-8',
      },
      {
        number: 5,
        date: '2016-5-1',
      },
    ];
    beforeEach(() => {
      files = fixture.collectionFiles().map((file, index) => {
        _.extend(file.data, additionalData[index]);
        return file;
      });
    });

    it('sorts integer value descending', () => {
      const sortConfig = {
        key: 'number',
        order: 'descending'
      };

      assert.deepEqual(
        CollectionBase.sortFiles(files, sortConfig),
        [files[0], files[2], files[1]]
      );
    });

    it('sorts integer value ascending', () => {
      const sortConfig = {
        key: 'number',
        order: 'ascending'
      };

      assert.deepEqual(
        CollectionBase.sortFiles(files, sortConfig),
        [files[1], files[2], files[0]]
      );
    });

    it('sorts date value descending', () => {
      const sortConfig = {
        key: 'date',
        order: 'descending'
      };

      assert.deepEqual(
        CollectionBase.sortFiles(files, sortConfig),
        [files[0], files[2], files[1]]
      );
    });

    it('sorts date value ascending', () => {
      const sortConfig = {
        key: 'date',
        order: 'ascending'
      };

      assert.deepEqual(
        CollectionBase.sortFiles(files, sortConfig),
        [files[1], files[2], files[0]]
      );
    });
  });
});
