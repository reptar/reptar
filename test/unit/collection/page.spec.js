import assert from 'assert';
import sinon from 'sinon';

import fixture from '../../fixture';
import {
  createMockConfig,
} from '../../utils';

import Url from '../../../lib/url';

import CollectionPage from '../../../lib/collection/page';

describe('collection/page CollectionPage', () => {
  const config = createMockConfig();

  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  const collectionPageData = {
    page: 2,

    // How many pages in the collection.
    total_pages: 3,

    // Posts displayed per page
    per_page: 1,

    // Total number of posts
    total: 3,
  };

  describe('constructor', () => {
    it('throws an error if it doesn\'t get expected values', () => {
      assert.throws(() => {
        // eslint-disable-next-line no-new
        new CollectionPage();
      }, /ID as a string.$/);

      assert.throws(() => {
        // eslint-disable-next-line no-new
        new CollectionPage('idHere');
      }, /index.$/);
    });

    it('creates a unique id', () => {
      const id = 'idHere';
      const index = 4;

      const instance = new CollectionPage(id, index);

      assert.equal(instance.id, `${id}:${index}`);
      assert.equal(instance.collectionId, id);
      assert.equal(instance.index, index);
      assert.equal(instance.data.page, index + 1);
    });
  });

  describe('setData', () => {
    it('saves passed in values', () => {
      const data = collectionPageData;
      const files = fixture.collectionFiles();

      const instance = new CollectionPage('id', 2, {
        config,
      });
      instance.permalink = 'ok';

      instance.setData(data);
      instance.setFiles(files);

      data.files = files.map(file => file.data);
      data.url = Url.makePretty(Url.makeUrlFileSystemSafe(instance.permalink));

      assert.deepEqual(instance.data, data);
    });
  });
});
