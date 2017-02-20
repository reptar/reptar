import assert from 'power-assert';
import fs from 'fs-extra';
import sinon from 'sinon';
import fixture from '../../fixture';
import PluginManager from '../../../lib/plugin/plugin-manager';
import PluginEvents from '../../../lib/plugin/events';
import CollectionBase from '../../../lib/collection/base';

import Renderer from '../../../lib/renderer/renderer';

describe('renderer Renderer', () => {
  let sandbox;
  let pluginManager;
  let instance;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    pluginManager = new PluginManager();

    instance = new Renderer({
      pluginManager,
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('renderFileWithPlugins', () => {
    it('calls all functions in expected order', async () => {
      // Disallow actually writing to disk.
      sandbox.stub(fs, 'outputFile', (...args) => {
        // Call callback.
        args[args.length - 1]();
      });

      const renderContent = 'hello world';

      const collection = new CollectionBase('name');
      collection.files = fixture.collectionFiles().map((file) => {
        file.render = sinon.spy(() => renderContent);
        return file;
      });

      const file = collection.files[0];
      const beforeSpy = sinon.spy();
      const afterSpy = sinon.spy((val, val2) => [val, val2]);
      pluginManager.pluginApi.event.file.beforeRender(beforeSpy);
      pluginManager.pluginApi.event.file.afterRender(afterSpy);

      try {
        await instance.renderFileWithPlugins(
          file,
          {},
          PluginEvents.file.beforeRender,
          PluginEvents.file.afterRender
        );
      } catch (e) {
        // noop
      }

      assert.equal(beforeSpy.callCount, 1);
      assert.ok(beforeSpy.calledWith(file));

      assert.equal(file.render.callCount, 1);
      assert.ok(file.render.calledWith({}));

      assert.equal(afterSpy.callCount, 1);
      assert.ok(afterSpy.calledWith(file, renderContent));
    });
  });
});
