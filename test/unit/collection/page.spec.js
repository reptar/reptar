import {assert} from 'chai';
import sinon from 'sinon';

import fixture from '../../fixture';

import CollectionPage from '../../../lib/collection/page.js';

describe('collection/page CollectionPage', () => {

  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  let collectionPageData = {
    page: 2,

    // How many pages in the collection.
    total_pages: 3,

    // Posts displayed per page
    per_page: 1,

    // Total number of posts
    total: 3
  };

  describe('constructor', () => {
    it('throws an error if it doesn\'t get expected values', () => {
      assert.throws(() => {
        new CollectionPage();
      }, /ID as a string.$/);

      assert.throws(() => {
        new CollectionPage('idHere');
      }, /index.$/);
    });

    it('creates a unique id', () => {
      let id = 'idHere';
      let index = 4;

      let instance = new CollectionPage(id, index);

      assert.equal(instance.id, `${id}:${index}`);
      assert.equal(instance._collectionId, id);
      assert.equal(instance._index, index);
      assert.equal(instance.data.page, index + 1);
    });
  });

  describe('setData', () => {
    it('saves passed in values', () => {
      let data = collectionPageData;
      data.files = fixture.collectionFiles();

      let instance = new CollectionPage('id', 2);
      instance.permalink = 'ok';

      instance.setData(data);

      data.files = data.files.map(file => file.data);
      data.url = instance.permalink;

      assert.deepEqual(instance.data, data);
    });
  });

  it('TODO: calculateDestination', () => {
    assert.ok('TODO');
  });

});
