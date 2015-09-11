import {assert} from 'chai';
import sinon from 'sinon';

import fixture from '../../../fixture';

import Plugin from '../../../../lib/plugin/index.js';
import CollectionPage from '../../../../lib/collection/page.js';

import CollectionBase from '../../../../lib/collection/base.js';
import FileSystemCollection
  from '../../../../lib/collection/type/file-system.js';

describe('collection/type/file-system FileSystemCollection', () => {

  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    Plugin._reset();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('_isFileInCollection', () => {
    it('is false if file\'s path is not within collection\'s path', () => {
      let path = 'my/file/path';
      let instance = new FileSystemCollection('name');
      instance.path = path;

      let file = {
        path: 'my/file'
      };

      assert.equal(instance._isFileInCollection(file), false);

      file = {
        path: 'my/file/pat'
      };

      assert.equal(instance._isFileInCollection(file), false);

      file = {
        path: 'your/file/path/is/close'
      };

      assert.equal(instance._isFileInCollection(file), false);
    });

    it('is true if file\'s path includes collection\'s path', () => {
      let path = 'my/file/path';
      let instance = new FileSystemCollection('name');
      instance.path = path;
      sinon.stub(instance, '_isFileExcluded').returns(false);

      let file = {
        path: 'my/file/path'
      };

      assert.equal(instance._isFileInCollection(file), true);

      file = {
        path: 'my/file/path/is/deeper'
      };

      assert.equal(instance._isFileInCollection(file), true);
    });

    it('is false if file\'s path is excluded from collection', () => {
      let path = 'my/file/path';
      let instance = new FileSystemCollection('name');
      instance.path = path;
      sinon.stub(instance, '_isFileExcluded').returns(true);

      let file = {
        path: 'my/file/path'
      };

      assert.equal(instance._isFileInCollection(file), false);

      file = {
        path: 'my/file/path/is/deeper'
      };

      assert.equal(instance._isFileInCollection(file), false);
    });
  });

  describe('populate', () => {
    it('adds files to collection', () => {
      let instance = new FileSystemCollection('name');
      instance.path = 'ok';
      instance.permalink = '/my/:permalink';
      sinon.stub(instance, 'createCollectionPages').returns(sinon.spy());
      sinon.stub(instance, '_isFileInCollection').returns(true);
      sandbox.spy(CollectionBase, 'sortFiles');
      assert.isUndefined(instance.files);

      let files = fixture.collectionFiles();
      assert.deepEqual(instance.populate(files), instance);
      assert.equal(instance.createCollectionPages.calledOnce, true);
      assert.equal(CollectionBase.sortFiles.calledOnce, true);
      assert.isUndefined(instance.metadataFiles);

      files.forEach((file, index)=> {
        assert.equal(file.permalink, instance.permalink);
        assert.equal(file.data, instance.data.files[index]);
      });
    });

    it('does not add files to collection', () => {
      let instance = new FileSystemCollection('name');
      instance.path = 'ok';
      instance.permalink = '/my/:permalink';
      sinon.stub(instance, 'createCollectionPages').returns(sinon.spy());
      sinon.stub(instance, '_isFileInCollection').returns(false);
      sandbox.spy(CollectionBase, 'sortFiles');
      assert.isUndefined(instance.files);

      let files = fixture.collectionFiles();
      assert.deepEqual(instance.populate(files), instance);
      assert.equal(instance.createCollectionPages.calledOnce, true);
      assert.equal(CollectionBase.sortFiles.calledOnce, true);

      files.forEach((file)=> {
        assert.isUndefined(file.permalink);
      });

      assert.isArray(instance.files);
      assert.isUndefined(instance.metadataFiles);
      assert.lengthOf(instance.files, 0);

      assert.isArray(instance.data.files);
      assert.lengthOf(instance.data.files, 0);
    });
  });

  describe('createCollectionPages', () => {
    it('adds files to collectionPages', () => {
      let pageSize = 1;

      let instance = new FileSystemCollection('name');
      instance.files = fixture.collectionFiles();
      instance.pagination = {};
      instance.pagination.size = pageSize;
      instance.pagination.permalinkIndex = 'index.html';
      instance.pagination.permalinkPage = '/page.html';
      assert.lengthOf(instance.pages, 0);

      assert.equal(instance.createCollectionPages(), true);

      assert.lengthOf(instance.pages, 3);

      instance.pages.forEach((page, index) => {
        assert.instanceOf(page, CollectionPage);
        assert.deepEqual(page.data.files, [instance.files[index].data]);

        let expectedPermalink = index === 0 ?
          instance.pagination.permalinkIndex :
          instance.pagination.permalinkPage;

        assert.equal(page.permalink, expectedPermalink);

        assert.equal(page.data.total_pages, instance.files.length / pageSize);
        assert.equal(page.data.per_page, pageSize);
        assert.equal(page.data.total, instance.files.length);

        if (index === 0) {
          assert.isUndefined(page.data.prev);
          assert.isUndefined(page.data.prev_link);
        } else {
          let previous = instance.pages[index - 1];
          assert.equal(page.data.prev, previous.data.page);
          assert.equal(page.data.prev_link, previous.data.url);
        }

        if (index === (instance.pages.length - 1)) {
          assert.isUndefined(page.data.next);
          assert.isUndefined(page.data.next_link);
        } else {
          let next = instance.pages[index + 1];
          assert.equal(page.data.next, next.data.page);
          assert.equal(page.data.next_link, next.data.url);
        }

        assert.deepEqual(instance.data.pages[index], page.data);
      });
    });
  });

  describe('createCollectionPages', () => {
    it('returns early if no pagination permalinks are set', () => {
      let instance = new FileSystemCollection('name');
      assert.equal(instance.createCollectionPages(), false);

      instance.pagination = {};
      instance.pagination.permalinkIndex = 'index.html';
      instance.pagination.permalinkPage = undefined;
      assert.equal(instance.createCollectionPages(), false);

      instance.pagination.permalinkIndex = undefined;
      instance.pagination.permalinkPage = '/page.html';
      assert.equal(instance.createCollectionPages(), false);
    });
  });

  describe('_setExcludePaths', () => {
    let excludeCollections = [
      {
        path: '/my/path'
      },
      {
        path: 'your/path'
      }
    ];

    const excludePaths = excludeCollections.map(coll => coll.path);

    it('can set exclude paths', () => {
      let instance = new FileSystemCollection('name');
      assert.isUndefined(instance.path);
      assert.isArray(instance.excludePaths);
      assert.lengthOf(instance.excludePaths, 0);

      instance._setExcludePaths(Array.from(excludeCollections));
      assert.deepEqual(instance.excludePaths, excludePaths);
    });

    it('does not add its own path to the exclude path array', () => {
      let instance = new FileSystemCollection('name');
      instance.path = excludePaths[0];
      assert.isArray(instance.excludePaths);
      assert.lengthOf(instance.excludePaths, 0);

      instance._setExcludePaths(Array.from(excludeCollections));
      assert.deepEqual(instance.excludePaths, [excludePaths[1]]);
    });
  });

  describe('_isFileExcluded', () => {
    it('is false when FileSystemCollection has no path', () => {
      let instance = new FileSystemCollection('name');
      assert.isUndefined(instance.path);

      assert.equal(instance._isFileExcluded(), false);
      assert.equal(instance._isFileExcluded({}), false);
    });

    it('is false when FileSystemCollection has metadata', () => {
      let instance = new FileSystemCollection('name');
      instance.metadata = 'dummy/path';
      instance.metadata = 'fixture.collectionMetadataKey';

      assert.equal(instance._isFileExcluded(), false);
      assert.equal(instance._isFileExcluded({}), false);
      assert.equal(instance._isFileExcluded({}), false);
    });

    it('is false when no excludePaths are set', () => {
      let instance = new FileSystemCollection('name');
      instance.path = '/dummy/path';
      assert.isArray(instance.excludePaths);
      assert.lengthOf(instance.excludePaths, 0);

      assert.equal(instance._isFileExcluded(), false);
      assert.equal(instance._isFileExcluded({}), false);

      instance.excludePaths = [];

      assert.equal(instance._isFileExcluded(), false);
      assert.equal(instance._isFileExcluded({}), false);
    });

    it('is true if the file path is contained in our excludePaths', () => {
      let path = '/dummy/path';
      let instance = new FileSystemCollection('name');
      instance.path = path;
      instance.excludePaths = [
        'another/path',
        path
      ];

      let file = {
        path: `a/long${path}`
      };

      assert.equal(instance._isFileExcluded(file), true);
    });

    it('is false if the file path is not in our excludePaths', () => {
      let path = '/dummy/path';
      let instance = new FileSystemCollection('name');
      instance.path = path;
      instance.excludePaths = [
        'another/path',
        path
      ];

      let file = {
        path: 'a/long/time/ago'
      };

      assert.equal(instance._isFileExcluded(file), false);
    });
  });

});
