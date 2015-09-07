import {assert} from 'chai';
import sinon from 'sinon';

import fixture from '../../../fixture';

import Plugin from '../../../../lib/plugin/index.js';
import CollectionPage from '../../../../lib/collection/page.js';

import CollectionBase from '../../../../lib/collection/base.js';
import MetadataCollection from
  '../../../../lib/collection/type/metadata.js';

describe('collection/type/metadata MetadataCollection', () => {

  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    Plugin._reset();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('_isFileInCollection', () => {
    it('is false if file does not have collection\'s metadata key', () => {
      let instance = new MetadataCollection('name');
      instance.metadata = 'soMeta';

      let file = {
        data: {}
      };

      file.data.someMeta = 'ok';
      assert.equal(instance._isFileInCollection(file), false);

      file.data[instance.metadata] = undefined;
      assert.equal(instance._isFileInCollection(file), false);
    });

    it('is true if file has collection\'s metadata key', () => {
      let instance = new MetadataCollection('name');
      instance.metadata = 'soMeta';

      let file = {
        data: {}
      };

      file.data[instance.metadata] = null;
      assert.equal(instance._isFileInCollection(file), true);

      file.data[instance.metadata] = '';
      assert.equal(instance._isFileInCollection(file), true);

      file.data[instance.metadata] = [];
      assert.equal(instance._isFileInCollection(file), true);
    });
  });

  describe('populate', () => {
    it('adds files to collection', () => {
      let instance = new MetadataCollection('name');
      instance.metadata = fixture.collectionMetadataKey;
      sinon.stub(instance, '_createCollectionPages').returns(sinon.spy());
      sinon.stub(instance, '_isFileInCollection').returns(true);
      sandbox.spy(CollectionBase, 'sortFiles');
      assert.isUndefined(instance.files);
      assert.isUndefined(instance.metadataFiles);

      let files = fixture.collectionFiles();
      assert.deepEqual(instance.populate(files), instance);
      assert.equal(instance._createCollectionPages.calledOnce, true);
      assert.equal(CollectionBase.sortFiles.called, false);

      assert.isUndefined(instance.files);
      assert.isObject(instance.metadataFiles);

      assert.equal(
        Object.keys(instance.metadataFiles).length,
        files.length
      );

      assert.lengthOf(instance.metadataFiles['norman'], 2);
      assert.lengthOf(instance.metadataFiles['rockwell'], 1);
      assert.lengthOf(instance.metadataFiles['null'], 1);

      assert.sameMembers(
        instance.metadataFiles['norman'],
        [files[0], files[1]]
      );

      assert.sameMembers(
        Object.keys(instance.metadataFiles),
        Object.keys(instance.data.metadata)
      );
    });

    it('does not add files to collection', () => {
      let instance = new MetadataCollection('name');
      instance.metadata = fixture.collectionMetadataKey;
      sinon.stub(instance, '_createCollectionPages').returns(sinon.spy());
      sinon.stub(instance, '_isFileInCollection').returns(false);
      sandbox.spy(CollectionBase, 'sortFiles');
      assert.isUndefined(instance.files);
      assert.isUndefined(instance.metadataFiles);

      let files = fixture.collectionFiles();
      assert.deepEqual(instance.populate(files), instance);
      assert.equal(instance._createCollectionPages.calledOnce, true);
      assert.equal(CollectionBase.sortFiles.called, false);

      assert.isUndefined(instance.files);
      assert.isObject(instance.metadataFiles);

      assert.equal(
        Object.keys(instance.metadataFiles).length,
        0
      );

      assert.equal(
        Object.keys(instance.data.metadata).length,
        0
      );
    });
  });


  describe('_createCollectionPages', () => {
    it('returns early if no pagination permalinks are set', () => {
      let instance = new MetadataCollection('name');
      assert.equal(instance._createCollectionPages(), false);

      instance.pagination = {};
      instance.pagination.permalinkIndex = 'index.html';
      instance.pagination.permalinkPage = undefined;
      assert.equal(instance._createCollectionPages(), false);

      instance.pagination.permalinkIndex = undefined;
      instance.pagination.permalinkPage = '/page.html';
      assert.equal(instance._createCollectionPages(), false);
    });

    let pageSize = 1;
    it('adds files to collectionPages', () => {
      let files = fixture.collectionFiles();
      let instance = new MetadataCollection('name');
      instance.metadata = fixture.collectionMetadataKey;
      instance.pagination = {};
      instance.pagination.size = pageSize;
      instance.pagination.permalinkIndex = 'index.html';
      instance.pagination.permalinkPage = '/page/:metadata/:page.html';
      assert.lengthOf(instance.pages, 0);
      assert.isUndefined(instance.metadataFiles);
      sinon.spy(instance, '_createCollectionPages');
      sandbox.spy(CollectionBase, 'sortFiles');

      // Use instance.populate so we have proper instance.metadataFiles
      // structure.
      instance.populate(files);
      assert.ok(instance._createCollectionPages.returned(true));

      assert.isObject(instance.metadataFiles);
      assert.equal(CollectionBase.sortFiles.callCount, 3);
      assert.lengthOf(instance.pages, 4);

      instance.pages.forEach((page, realIndex) => {
        // Since we have two files with same tag, they're in multiple pages.
        // This if statement just moves the pointer so we're interacting with
        // the right page data.
        let index = realIndex;
        let expectedPermalink = index === 0 ?
          instance.pagination.permalinkIndex :
          instance.pagination.permalinkPage;
        if (realIndex === 2) {
          index = 0;
          expectedPermalink = instance.pagination.permalinkIndex;
        } else if (realIndex === 3) {
          index = 0;
          expectedPermalink = instance.pagination.permalinkIndex;
        }

        let files = instance.metadataFiles[page.data.metadata];

        assert.instanceOf(page, CollectionPage);

        assert.deepEqual(page.data.files, [files[index].data]);

        assert.equal(page.permalink, expectedPermalink);
        assert.equal(page.data.total_pages, files.length / pageSize);
        assert.equal(page.data.per_page, pageSize);
        assert.equal(page.data.total, files.length);

        if (index === 0) {
          assert.isUndefined(page.data.prev);
          assert.isUndefined(page.data.prev_link);
        } else {
          assert.isUndefined(page.data.next);
          assert.isUndefined(page.data.next_link);

          let previous = instance.pages[index - 1];
          assert.equal(page.data.prev, previous.data.page);
          assert.equal(page.data.prev_link, previous.data.url);

          assert.isUndefined(page.data.next);
          assert.isUndefined(page.data.next_link);
        }

        assert.deepEqual(instance.data.pages[realIndex], page.data);
      });
    });
  });

});
