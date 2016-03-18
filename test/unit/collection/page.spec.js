import assert from 'power-assert';
import sinon from 'sinon';

import fixture from '../../fixture';
import {
  createMockConfig,
} from '../../utils';

import Url from '../../../lib/url';

import CollectionPage from '../../../lib/collection/page.js';

describe('collection/page CollectionPage', () => {
  let config = createMockConfig();
  let getConfig = () => config;

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
      let files = fixture.collectionFiles();

      let instance = new CollectionPage('id', 2);
      instance.setGetConfig(getConfig);
      instance.permalink = 'ok';

      instance.setData(data);
      instance.setFiles(files);

      data.files = files.map(file => file.data);
      data.url = Url.makePretty(Url.makeUrlFileSystemSafe(instance.permalink));

      assert.deepEqual(instance.data, data);
    });
  });

  describe('setFiles', () => {
    it('adds pageId information to each file.', () => {
      let files = fixture.collectionFiles().map(file => {
        file.pageIds = new Set();
        return file;
      });

      let instance = new CollectionPage('id', 2);
      instance.permalink = 'ok';

      files.forEach(file => {
        assert(!file.pageIds.has(instance.id));
      });

      instance.setFiles(files);

      files.forEach(file => {
        assert.ok(file.pageIds.has(instance.id));
      });
    });
  });
});
