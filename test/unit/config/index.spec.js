import assert from 'power-assert';
import sinon from 'sinon';
import path from 'path';
import each from 'lodash/each';

import fixture from '../../fixture';

import Config from '../../../lib/config/index.js';

describe('config/index Config', () => {

  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('can create an instance', () => {
      sandbox.spy(Config.prototype, 'loadLocal');
      sandbox.spy(Config.prototype, 'update');

      let instance = new Config();

      assert.ok(instance);
      assert(typeof instance._raw === 'object');

      assert(instance.loadLocal.calledOnce === false);
      assert(instance.update.calledOnce === false);
    });
  });

  describe('update', () => {
    it('calculates paths correctly', () => {
      sandbox.stub(Config.prototype, 'update').returns();

      let root = '/root/';

      let instance = new Config();
      instance._root = root;

      // Restore original update so we can actual test its behavior.
      instance.update.restore();

      instance.update(fixture.configDefault());

      let expectedConfig = fixture.configDefault();

      assert.equal(
        instance._raw.path.source,
        path.resolve(
          root + expectedConfig.path.source
        )
      );

      assert.equal(
        instance._raw.path.destination,
        path.resolve(
          root + expectedConfig.path.source + expectedConfig.path.destination
        )
      );

      assert.equal(
        instance._raw.path.plugins,
        path.resolve(
          root + expectedConfig.path.source + expectedConfig.path.plugins
        )
      );

      assert.equal(
        instance._raw.path.themes,
        path.resolve(
          root + expectedConfig.path.source + expectedConfig.path.themes
        )
      );

      each(instance.path, (val, key) => {
        assert.equal(instance.path[key], instance._raw.path[key]);
      });
    });
  });

  describe('defaultConfig', () => {
    it('returns an object', () => {
      assert(typeof Config.defaultConfig() === 'object');
    });
  });
});
