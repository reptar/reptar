const assert = require('chai').assert;
const sinon = require('sinon');
const fs = require('fs-extra');

const fixture = require('../../fixture');

const Collection = require('../../../lib/collection/index.js');
const CollectionPagination = require('../../../lib/collection/pagination.js');
const CollectionPage = require('../../../lib/collection/page.js');
const PluginAPI = require('../../../lib/plugin/api.js');
const Plugin = require('../../../lib/plugin/index.js');

describe('collection/index Collection', () => {

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
        new Collection();
      }, /requires a name/);

      assert.throws(() => {
        new Collection('');
      }, /requires a name/);
    });

    it('accepts a name and no config object', () => {
      let instance = new Collection('name');

      assert.equal(instance.name, 'name');
      assert.isUndefined(instance.path);
      assert.isUndefined(instance.metadata);
      assert.isUndefined(instance.layout);
      assert.isUndefined(instance.permalink);
      assert.isUndefined(instance.sort.key);
      assert.isUndefined(instance.sort.order);
      assert.instanceOf(instance.pagination, CollectionPagination);
      assert.isUndefined(instance.files);
      assert.isUndefined(instance.excludePaths);
      assert.isUndefined(instance.metadataFiles);
      assert.isArray(instance.pages);
      assert.lengthOf(instance.pages, 0);
      assert.isObject(instance.data);
    });
  });

  describe('setExcludePaths', () => {
    let excludePaths = [
      '/my/path',
      'your/path'
    ];

    it('can set exclude paths', () => {
      let instance = new Collection('name');
      assert.isUndefined(instance.path);
      assert.isUndefined(instance.excludePaths);

      instance.setExcludePaths(Array.from(excludePaths));
      assert.deepEqual(instance.excludePaths, excludePaths);
    });

    it('does not add its own path to the exclude path array', () => {
      let instance = new Collection('name');
      instance.path = excludePaths[0];
      assert.isUndefined(instance.excludePaths);

      instance.setExcludePaths(Array.from(excludePaths));
      assert.deepEqual(instance.excludePaths, [excludePaths[1]]);
    });
  });

  describe('isFileExcluded', () => {
    it('is false when Collection has no path', () => {
      let instance = new Collection('name');
      assert.isUndefined(instance.path);

      assert.equal(instance.isFileExcluded(), false);
      assert.equal(instance.isFileExcluded({}), false);
    });

    it('is false when Collection has metadata', () => {
      let instance = new Collection('name');
      instance.metadata = 'dummy/path';
      instance.metadata = 'fixture.collectionMetadataKey';

      assert.equal(instance.isFileExcluded(), false);
      assert.equal(instance.isFileExcluded({}), false);
      assert.equal(instance.isFileExcluded({}), false);
    });

    it('is false when no excludePaths are set', () => {
      let instance = new Collection('name');
      instance.path = '/dummy/path';
      assert.isUndefined(instance.excludePaths);

      assert.equal(instance.isFileExcluded(), false);
      assert.equal(instance.isFileExcluded({}), false);

      instance.excludePaths = [];

      assert.equal(instance.isFileExcluded(), false);
      assert.equal(instance.isFileExcluded({}), false);
    });

    it('is true if the file path is contained in our excludePaths', () => {
      let path = '/dummy/path';
      let instance = new Collection('name');
      instance.path = path;
      instance.excludePaths = [
        'another/path',
        path
      ];

      let file = {
        path: `a/long${path}`
      };

      assert.equal(instance.isFileExcluded(file), true);
    });

    it('is false if the file path is not in our excludePaths', () => {
      let path = '/dummy/path';
      let instance = new Collection('name');
      instance.path = path;
      instance.excludePaths = [
        'another/path',
        path
      ];

      let file = {
        path: 'a/long/time/ago'
      };

      assert.equal(instance.isFileExcluded(file), false);
    });
  });

  describe('isFileInCollection', () => {
    it('returns false when collection has no path or metadata', () => {
      let instance = new Collection('name');
      assert.equal(instance.isFileInCollection(), false);
    });

    describe('with path', () => {
      it('is false if file\'s path is not within collection\'s path', () => {
        let path = 'my/file/path';
        let instance = new Collection('name');
        instance.path = path;

        let file = {
          path: 'my/file'
        };

        assert.equal(instance.isFileInCollection(file), false);

        file = {
          path: 'my/file/pat'
        };

        assert.equal(instance.isFileInCollection(file), false);

        file = {
          path: 'your/file/path/is/close'
        };

        assert.equal(instance.isFileInCollection(file), false);
      });

      it('is true if file\'s path includes collection\'s path', () => {
        let path = 'my/file/path';
        let instance = new Collection('name');
        instance.path = path;
        sinon.stub(instance, 'isFileExcluded').returns(false);

        let file = {
          path: 'my/file/path'
        };

        assert.equal(instance.isFileInCollection(file), true);

        file = {
          path: 'my/file/path/is/deeper'
        };

        assert.equal(instance.isFileInCollection(file), true);
      });

      it('is false if file\'s path is excluded from collection', () => {
        let path = 'my/file/path';
        let instance = new Collection('name');
        instance.path = path;
        sinon.stub(instance, 'isFileExcluded').returns(true);

        let file = {
          path: 'my/file/path'
        };

        assert.equal(instance.isFileInCollection(file), false);

        file = {
          path: 'my/file/path/is/deeper'
        };

        assert.equal(instance.isFileInCollection(file), false);
      });
    });

    describe('with metadata', () => {
      it('is false if file does not have collection\'s metadata key', () => {
        let instance = new Collection('name');
        instance.metadata = 'soMeta';

        let file = {
          data: {}
        };

        file.data.someMeta = 'ok';
        assert.equal(instance.isFileInCollection(file), false);

        file.data[instance.metadata] = undefined;
        assert.equal(instance.isFileInCollection(file), false);
      });

      it('is true if file has collection\'s metadata key', () => {
        let instance = new Collection('name');
        instance.metadata = 'soMeta';

        let file = {
          data: {}
        };

        file.data[instance.metadata] = null;
        assert.equal(instance.isFileInCollection(file), true);

        file.data[instance.metadata] = '';
        assert.equal(instance.isFileInCollection(file), true);

        file.data[instance.metadata] = [];
        assert.equal(instance.isFileInCollection(file), true);
      });
    });
  });

  describe('populate', () => {
    describe('with path', () => {
      it('adds files to collection', () => {
        let instance = new Collection('name');
        instance.path = 'ok';
        instance.permalink = '/my/:permalink';
        sinon.stub(instance, 'createCollectionPages').returns(sinon.spy());
        sinon.stub(instance, 'isFileInCollection').returns(true);
        sandbox.spy(Collection, 'sortFiles');
        assert.isUndefined(instance.files);

        let files = fixture.collectionFiles();
        assert.deepEqual(instance.populate(files), instance);
        assert.equal(instance.createCollectionPages.calledOnce, true);
        assert.equal(Collection.sortFiles.calledOnce, true);
        assert.isUndefined(instance.metadataFiles);

        files.forEach((file, index)=> {
          assert.equal(file.permalink, instance.permalink);
          assert.equal(file.data, instance.data.files[index]);
        });
      });

      it('does not add files to collection', () => {
        let instance = new Collection('name');
        instance.path = 'ok';
        instance.permalink = '/my/:permalink';
        sinon.stub(instance, 'createCollectionPages').returns(sinon.spy());
        sinon.stub(instance, 'isFileInCollection').returns(false);
        sandbox.spy(Collection, 'sortFiles');
        assert.isUndefined(instance.files);

        let files = fixture.collectionFiles();
        assert.deepEqual(instance.populate(files), instance);
        assert.equal(instance.createCollectionPages.calledOnce, true);
        assert.equal(Collection.sortFiles.calledOnce, true);

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

    describe('with metadata', () => {
      it('adds files to collection', () => {
        let instance = new Collection('name');
        instance.metadata = fixture.collectionMetadataKey;
        sinon.stub(instance, 'createCollectionPages').returns(sinon.spy());
        sinon.stub(instance, 'isFileInCollection').returns(true);
        sandbox.spy(Collection, 'sortFiles');
        assert.isUndefined(instance.files);
        assert.isUndefined(instance.metadataFiles);

        let files = fixture.collectionFiles();
        assert.deepEqual(instance.populate(files), instance);
        assert.equal(instance.createCollectionPages.calledOnce, true);
        assert.equal(Collection.sortFiles.called, false);

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
        let instance = new Collection('name');
        instance.metadata = fixture.collectionMetadataKey;
        sinon.stub(instance, 'createCollectionPages').returns(sinon.spy());
        sinon.stub(instance, 'isFileInCollection').returns(false);
        sandbox.spy(Collection, 'sortFiles');
        assert.isUndefined(instance.files);
        assert.isUndefined(instance.metadataFiles);

        let files = fixture.collectionFiles();
        assert.deepEqual(instance.populate(files), instance);
        assert.equal(instance.createCollectionPages.calledOnce, true);
        assert.equal(Collection.sortFiles.called, false);

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
  });

  describe('createCollectionPages', () => {
    it('returns early if no pagination permalinks are set', () => {
      let instance = new Collection('name');
      assert.equal(instance.createCollectionPages(), false);

      instance.pagination.permalinkIndex = 'index.html';
      instance.pagination.permalinkPage = undefined;
      assert.equal(instance.createCollectionPages(), false);

      instance.pagination.permalinkIndex = undefined;
      instance.pagination.permalinkPage = '/page.html';
      assert.equal(instance.createCollectionPages(), false);
    });

    let pageSize = 1;

    describe('with path', () => {
      it('adds files to collection', () => {
        let instance = new Collection('name');
        instance.files = fixture.collectionFiles();
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

    describe('with metadata', () => {
      it('adds files to collection', () => {
        let files = fixture.collectionFiles();
        let instance = new Collection('name');
        instance.metadata = fixture.collectionMetadataKey;
        instance.pagination.size = pageSize;
        instance.pagination.permalinkIndex = 'index.html';
        instance.pagination.permalinkPage = '/page/:metadata/:page.html';
        assert.lengthOf(instance.pages, 0);
        assert.isUndefined(instance.metadataFiles);
        sinon.spy(instance, 'createCollectionPages');
        sandbox.spy(Collection, 'sortFiles');

        // Use instance.populate so we have proper instance.metadataFiles
        // structure.
        instance.populate(files);
        assert.ok(instance.createCollectionPages.returned(true));

        assert.isObject(instance.metadataFiles);
        assert.equal(Collection.sortFiles.callCount, 3);
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

  describe('writeFile', () => {
    it('calls all functions in expected order', async () => {
      let renderContent = 'hello world';

      let instance = new Collection('name');
      instance.files = fixture.collectionFiles().map(file => {
        file.render = sinon.spy(() => {
          return renderContent;
        });
        return file;
      });

      sandbox.stub(Collection, '_writeToFileSystem').returns(sinon.spy());

      let file = instance.files[0];
      let beforeSpy = sinon.spy();
      let afterSpy = sinon.spy((val) => val);
      PluginAPI.event.file.beforeRender(beforeSpy);
      PluginAPI.event.file.afterRender(afterSpy);

      try {
        await instance.writeFile(file, {});
      } catch (e) {
        console.log(e);
      }

      assert.equal(beforeSpy.callCount, 1);
      assert.ok(beforeSpy.calledWith(file));

      assert.equal(file.render.callCount, 1);
      assert.ok(file.render.calledWith(instance.layout, {}));

      assert.equal(afterSpy.callCount, 1);
      assert.ok(afterSpy.calledWith(renderContent));

      assert.equal(Collection._writeToFileSystem.callCount, 1);
      assert.ok(
        Collection._writeToFileSystem.calledWith(
          file.destination,
          renderContent
        )
      );

      assert.ok(beforeSpy.calledBefore(file.render));
      assert.ok(file.render.calledBefore(afterSpy));
      assert.ok(afterSpy.calledBefore(Collection._writeToFileSystem));
    });
  });

  describe('writeCollectionPage', () => {
    it('calls all functions in expected order', async () => {
      let renderContent = 'hello world';
      let layout = 'layout.html';
      let collectionPage = {
        destination: './path/to/destination',
        render: sinon.spy(() => {
          return renderContent;
        })
      };

      let instance = new Collection('name');
      instance.pagination = {
        layout: layout
      };

      sandbox.stub(Collection, '_writeToFileSystem').returns(sinon.spy());

      let beforeSpy = sinon.spy();
      let afterSpy = sinon.spy((val) => val);
      PluginAPI.event.page.beforeRender(beforeSpy);
      PluginAPI.event.page.afterRender(afterSpy);

      try {
        await instance.writeCollectionPage(collectionPage, {});
      } catch (e) {
        console.log(e);
      }

      assert.equal(beforeSpy.callCount, 1);
      assert.ok(beforeSpy.calledWith(collectionPage));

      assert.equal(collectionPage.render.callCount, 1);
      assert.ok(collectionPage.render.calledWith(layout, {}));

      assert.equal(afterSpy.callCount, 1);
      assert.ok(afterSpy.calledWith(renderContent));

      assert.equal(Collection._writeToFileSystem.callCount, 1);
      assert.ok(
        Collection._writeToFileSystem.calledWith(
          collectionPage.destination,
          renderContent
        )
      );

      assert.ok(beforeSpy.calledBefore(collectionPage.render));
      assert.ok(collectionPage.render.calledBefore(afterSpy));
      assert.ok(afterSpy.calledBefore(Collection._writeToFileSystem));
    });
  });

  describe('_writeToFileSystem', () => {
    it('calls all functions in expected order', async () => {
      sandbox.stub(fs, 'outputFileAsync').returns(sinon.spy());

      let path = './path/to/write/file';
      let content = 'this is the excellent content';

      let beforeSpy = sinon.spy();
      let afterSpy = sinon.spy((val) => val);
      PluginAPI.event.collection.beforeWrite(beforeSpy);
      PluginAPI.event.collection.afterWrite(afterSpy);

      try {
        await Collection._writeToFileSystem(path, content);
      } catch (e) {
        console.log(e);
      }

      let fileSystemFile = {
        path,
        content
      };

      assert.equal(beforeSpy.callCount, 1);
      assert.ok(beforeSpy.calledWith(fileSystemFile));

      assert.equal(fs.outputFileAsync.callCount, 1);
      assert.ok(fs.outputFileAsync.calledWith(path, content, 'utf8'));

      assert.equal(afterSpy.callCount, 1);
      assert.ok(afterSpy.calledWith(fileSystemFile));

      assert.ok(beforeSpy.calledBefore(fs.outputFileAsync));
      assert.ok(fs.outputFileAsync.calledBefore(afterSpy));
      assert.ok(afterSpy.calledBefore(Collection._writeToFileSystem));
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
        Collection.sortFiles(files, sortConfig),
        [files[0], files[2], files[1]]
      );

      sortConfig.order = '';

      assert.deepEqual(
        Collection.sortFiles(files, sortConfig),
        [files[1], files[2], files[0]]
      );
    });
  });
});
