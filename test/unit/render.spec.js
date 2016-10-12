import assert from 'power-assert';
import fs from 'fs-extra';
import sinon from 'sinon';
import fixture from '../fixture';
import Plugin from '../../lib/plugin/index.js';
const PluginAPI = Plugin.API;
import CollectionBase from '../../lib/collection/base.js';
import {
  writeToDiskWithPlugins,
  renderAndWriteFileWithPlugins,
} from '../../lib/render.js';

describe('render Render', function() {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    Plugin._reset();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('renderFileWithPlugins', () => {
    it('calls all functions in expected order', async () => {
      // Disallow actually writing to disk.
      sandbox.stub(fs, 'outputFile', function(...args) {
        // Call callback.
        args[args.length - 1]();
      });

      const renderContent = 'hello world';

      const instance = new CollectionBase('name');
      instance.files = fixture.collectionFiles().map(file => {
        file.render = sinon.spy(() => {
          return renderContent;
        });
        return file;
      });

      const file = instance.files[0];
      const beforeSpy = sinon.spy();
      const afterSpy = sinon.spy((val, val2) => [val, val2]);
      PluginAPI.event.file.beforeRender(beforeSpy);
      PluginAPI.event.file.afterRender(afterSpy);

      try {
        await renderAndWriteFileWithPlugins(
          file,
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
      assert.ok(file.render.calledWith({}));

      assert.equal(afterSpy.callCount, 1);
      assert.ok(afterSpy.calledWith(file, renderContent));
    });
  });

  describe('writeToDiskWithPlugins', () => {
    it('calls all functions in expected order', async () => {
      sandbox.stub(fs, 'outputFile', function(...args) {
        // Call callback.
        args[args.length - 1]();
      });

      const mockFile = {
        destination: './path/to/write/file'
      };
      const content = 'this is the excellent content';

      const beforeSpy = sinon.spy();
      const afterSpy = sinon.spy((val) => val);
      PluginAPI.event.collection.beforeWrite(beforeSpy);
      PluginAPI.event.collection.afterWrite(afterSpy);

      try {
        await writeToDiskWithPlugins(mockFile, content);
      } catch (e) {
        console.log(e);
      }

      assert.equal(beforeSpy.callCount, 1);
      assert.ok(beforeSpy.calledWith(mockFile, content));

      assert.equal(fs.outputFile.callCount, 1);
      assert.ok(fs.outputFile.calledWith(
        mockFile.destination,
        content,
        'utf8'
      ));

      assert.equal(afterSpy.callCount, 1);
      assert.ok(afterSpy.calledWith(mockFile, content));

      assert.ok(beforeSpy.calledBefore(fs.outputFile));
      assert.ok(fs.outputFile.calledBefore(afterSpy));
      assert.ok(afterSpy.calledBefore(writeToDiskWithPlugins));
    });
  });
});
