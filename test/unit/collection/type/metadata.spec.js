import assert from 'power-assert';
import sinon from 'sinon';
import _ from 'lodash';

import fixture from '../../../fixture';
import {
  createMockConfig,
} from '../../../utils';

import Plugin from '../../../../lib/plugin/index.js';
import CollectionPage from '../../../../lib/collection/page.js';

import CollectionBase from '../../../../lib/collection/base.js';
import MetadataCollection from
  '../../../../lib/collection/type/metadata.js';

describe('collection/type/metadata MetadataCollection', () => {
  const config = createMockConfig();
  const getConfig = () => config;

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
      const instance = new MetadataCollection('name');
      instance.metadata = 'soMeta';

      const file = {
        data: {}
      };

      file.data.someMeta = 'ok';
      assert.equal(instance._isFileInCollection(file), false);

      file.data[instance.metadata] = undefined;
      assert.equal(instance._isFileInCollection(file), false);
    });

    it('is true if file has collection\'s metadata key', () => {
      const instance = new MetadataCollection('name');
      instance.metadata = 'soMeta';

      const file = {
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
      const instance = new MetadataCollection('name');
      instance.metadata = fixture.collectionMetadataKey;
      sinon.stub(instance, 'createCollectionPages').returns(sinon.spy());
      sinon.stub(instance, '_isFileInCollection').returns(true);
      sandbox.spy(CollectionBase, 'sortFiles');
      assert(_.isUndefined(instance.files));
      assert(_.isUndefined(instance.metadataFiles));

      const files = fixture.collectionFiles();
      assert.deepEqual(instance.populate(files), instance);
      assert.equal(instance.createCollectionPages.calledOnce, true);
      assert.equal(CollectionBase.sortFiles.called, false);

      assert(_.isUndefined(instance.files));
      assert(typeof instance.metadataFiles === 'object');

      assert.equal(
        Object.keys(instance.metadataFiles).length,
        files.length
      );

      assert.equal(instance.metadataFiles['norman'].length, 2);
      assert.equal(instance.metadataFiles['rockwell'].length, 1);
      assert.equal(instance.metadataFiles['null'].length, 1);

      assert(_.isEqual(
        instance.metadataFiles['norman'],
        [files[0], files[1]]
      ));

      assert(_.isEqual(
        Object.keys(instance.metadataFiles),
        Object.keys(instance.data.metadata)
      ));
    });

    it('does not add files to collection', () => {
      const instance = new MetadataCollection('name');
      instance.metadata = fixture.collectionMetadataKey;
      sinon.stub(instance, 'createCollectionPages').returns(sinon.spy());
      sinon.stub(instance, '_isFileInCollection').returns(false);
      sandbox.spy(CollectionBase, 'sortFiles');
      assert(_.isUndefined(instance.files));
      assert(_.isUndefined(instance.metadataFiles));

      const files = fixture.collectionFiles();
      assert.deepEqual(instance.populate(files), instance);
      assert.equal(instance.createCollectionPages.calledOnce, true);
      assert.equal(CollectionBase.sortFiles.called, false);

      assert(_.isUndefined(instance.files));
      assert(typeof instance.metadataFiles === 'object');

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


  describe('createCollectionPages', () => {
    it('returns early if no pagination permalinks are set', () => {
      const instance = new MetadataCollection('name', undefined, getConfig);
      assert.equal(instance.createCollectionPages(), false);

      instance.permalink = {};
      instance.permalink.index = 'index.html';
      instance.permalink.page = undefined;
      assert.equal(instance.createCollectionPages(), false);

      instance.permalink.index = undefined;
      instance.permalink.page = '/page.html';
      assert.equal(instance.createCollectionPages(), false);
    });

    const pageSize = 1;
    it('adds files to collectionPages', () => {
      const files = fixture.collectionFiles();
      const instance = new MetadataCollection('name', undefined, getConfig);
      instance.metadata = fixture.collectionMetadataKey;
      instance.permalink = {};
      instance.pageSize = pageSize;
      instance.permalink.index = 'index.html';
      instance.permalink.page = '/page/:metadata/:page.html';
      assert.equal(instance.pages.length, 0);
      assert(_.isUndefined(instance.metadataFiles));
      sinon.spy(instance, 'createCollectionPages');
      sandbox.spy(CollectionBase, 'sortFiles');

      // Use instance.populate so we have proper instance.metadataFiles
      // structure.
      instance.populate(files);
      assert.ok(instance.createCollectionPages.returned(true));

      assert(typeof instance.metadataFiles === 'object');
      assert.equal(CollectionBase.sortFiles.callCount, 3);
      assert.equal(instance.pages.length, 4);

      instance.pages.forEach((page, realIndex) => {
        // Since we have two files with same tag, they're in multiple pages.
        // This if statement just moves the pointer so we're interacting with
        // the right page data.
        let index = realIndex;
        let expectedPermalink = index === 0 ?
          instance.permalink.index :
          instance.permalink.page;
        if (realIndex === 2) {
          index = 0;
          expectedPermalink = instance.permalink.index;
        } else if (realIndex === 3) {
          index = 0;
          expectedPermalink = instance.permalink.index;
        }

        const files = instance.metadataFiles[page.data.metadata];

        assert(page instanceof CollectionPage);

        assert.deepEqual(page.data.files, [files[index].data]);

        assert.equal(page.permalink, expectedPermalink);
        assert.equal(page.data.total_pages, files.length / pageSize);
        assert.equal(page.data.per_page, pageSize);
        assert.equal(page.data.total, files.length);

        if (index === 0) {
          assert(_.isUndefined(page.data.prev));
          assert(_.isUndefined(page.data.prev_link));
        } else {
          assert(_.isUndefined(page.data.next));
          assert(_.isUndefined(page.data.next_link));

          const previous = instance.pages[index - 1];
          assert.equal(page.data.prev, previous.data.page);
          assert.equal(page.data.prev_link, previous.data.url);

          assert(_.isUndefined(page.data.next));
          assert(_.isUndefined(page.data.next_link));
        }

        assert.deepEqual(instance.data.pages[realIndex], page.data);
      });
    });
  });

});
