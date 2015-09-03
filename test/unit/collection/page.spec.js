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
      }, /as a number/);
    });

    it('causes calculateDestination to be called', () => {
      sandbox.spy(CollectionPage.prototype, 'calculateDestination');

      let instance = new CollectionPage([], 'template', collectionPageData);
      assert.ok(instance.calculateDestination.calledOnce);
    });

    it('saves passed in values', () => {
      let data = collectionPageData;
      let permalink = 'hello';
      let files = fixture.collectionFiles();

      let instance = new CollectionPage(
        files,
        permalink,
        data
      );

      assert.deepEqual(instance.data, data);
      assert.deepEqual(instance.permalink, permalink);
      assert.deepEqual(instance.data.files, files.map(file => file.data));
    });
  });

  it('TODO: calculateDestination', () => {
    assert.ok('TODO');
  });

});
