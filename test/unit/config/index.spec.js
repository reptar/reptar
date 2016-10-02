import assert from 'power-assert';
import rewire from 'rewire';
import sinon from 'sinon';
import path from 'path';
import _ from 'lodash';

import fixture from '../../fixture';

const ConfigRewire = rewire('../../../lib/config/index.js');
const Config = ConfigRewire.default;

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
      sandbox.spy(Config.prototype, 'update');

      const instance = new Config();

      assert.ok(instance);
      assert(typeof instance._raw === 'object');

      assert(instance.update.calledOnce === false);
    });
  });

  describe('update', () => {
    it('calculates paths correctly', () => {
      sandbox.stub(Config.prototype, 'update').returns();

      const root = '/root/';

      const instance = new Config();
      instance._root = root;

      // Restore original update so we can actual test its behavior.
      instance.update.restore();

      const revert = ConfigRewire.__set__(
        'loadAndParseYaml',
        sinon.stub().returns(fixture.configDefault())
      );

      instance.update();

      const expectedConfig = fixture.configDefault();

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

      _.each(instance.path, (val, key) => {
        assert.equal(instance.path[key], instance._raw.path[key]);
      });

      revert();
    });

    it('throws when given an invalid config object', () => {
      const root = '/root/';

      const instance = new Config();
      instance._root = root;

      const invalidConfigs = [
        {
          path: false,
        },
        {
          site: 'Test',
        }
      ];

      invalidConfigs.forEach(config => {
        assert.throws(() => instance.update(config));
      });
    });
  });
});
