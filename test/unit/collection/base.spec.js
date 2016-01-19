import {assert} from 'chai';
import sinon from 'sinon';
import fs from 'fs-extra';

import fixture from '../../fixture';

import Plugin from '../../../lib/plugin/index.js';
const PluginAPI = Plugin.API;

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
      assert.isUndefined(instance.path);
      assert.isUndefined(instance.metadata);
      assert.isUndefined(instance.template);
      assert.isUndefined(instance.permalink);
      assert.isUndefined(instance.static);
      assert.isUndefined(instance.staticDestination);
      assert.isUndefined(instance.sort);
      assert.isUndefined(instance.pagination);
      assert.isUndefined(instance.files);
      assert.isUndefined(instance.excludePaths);
      assert.isUndefined(instance.metadataFiles);
      assert.isArray(instance.pages);
      assert.lengthOf(instance.pages, 0);
      assert.isObject(instance.data);
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

  describe('renderAndWriteFile', () => {
    it('calls all functions in expected order', async () => {
      let renderContent = 'hello world';

      let instance = new CollectionBase('name');
      instance.files = fixture.collectionFiles().map(file => {
        file.render = sinon.spy(() => {
          return renderContent;
        });
        return file;
      });

      sandbox.stub(CollectionBase, 'writeToFileSystem').returns(sinon.spy());

      let file = instance.files[0];
      let beforeSpy = sinon.spy();
      let afterSpy = sinon.spy((val) => val);
      PluginAPI.event.file.beforeRender(beforeSpy);
      PluginAPI.event.file.afterRender(afterSpy);

      try {
        await CollectionBase.renderAndWriteFile(
          file,
          file.template,
          {},
          Plugin.Event.file.beforeRender,
          Plugin.Event.file.afterRender
        );
      } catch (e) {
        console.log(e);
      }

      assert.equal(beforeSpy.callCount, 1);
      assert.ok(beforeSpy.calledWith(file));

      assert.equal(file.render.callCount, 1);
      assert.ok(file.render.calledWith(instance.template, {}));

      assert.equal(afterSpy.callCount, 1);
      assert.ok(afterSpy.calledWith(renderContent));

      assert.equal(CollectionBase.writeToFileSystem.callCount, 1);
      assert.ok(
        CollectionBase.writeToFileSystem.calledWith(
          file,
          renderContent
        )
      );

      assert.ok(beforeSpy.calledBefore(file.render));
      assert.ok(file.render.calledBefore(afterSpy));
      assert.ok(afterSpy.calledBefore(CollectionBase.writeToFileSystem));
    });
  });

  describe('writeToFileSystem', () => {
    it('calls all functions in expected order', async () => {
      sandbox.stub(fs, 'outputFileAsync').returns(sinon.spy());

      let mockFile = {
        destination: './path/to/write/file'
      };
      let content = 'this is the excellent content';

      let beforeSpy = sinon.spy();
      let afterSpy = sinon.spy((val) => val);
      PluginAPI.event.collection.beforeWrite(beforeSpy);
      PluginAPI.event.collection.afterWrite(afterSpy);

      try {
        await CollectionBase.writeToFileSystem(mockFile, content);
      } catch (e) {
        console.log(e);
      }

      assert.equal(beforeSpy.callCount, 1);
      assert.ok(beforeSpy.calledWith(mockFile, content));

      assert.equal(fs.outputFileAsync.callCount, 1);
      assert.ok(fs.outputFileAsync.calledWith(
        mockFile.destination,
        content,
        'utf8'
      ));

      assert.equal(afterSpy.callCount, 1);
      assert.ok(afterSpy.calledWith(mockFile, content));

      assert.ok(beforeSpy.calledBefore(fs.outputFileAsync));
      assert.ok(fs.outputFileAsync.calledBefore(afterSpy));
      assert.ok(afterSpy.calledBefore(CollectionBase.writeToFileSystem));
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
