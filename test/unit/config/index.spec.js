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

      const instance = new Config('');

      assert.ok(instance);
      assert(typeof instance._raw === 'object');

      assert(instance.update.calledOnce === false);
    });
  });

  describe('update', () => {
    let revert;

    afterEach(() => {
      if (_.isFunction(revert)) {
        revert();
        revert = null;
      }
    });

    it('calculates paths correctly', () => {
      const root = '/root/';

      const instance = new Config('');
      instance.root = root;

      revert = ConfigRewire.__set__(
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
    });

    it('throws when given an invalid config object', () => {
      const root = '/root/';

      const instance = new Config('');
      instance.root = root;

      const invalidConfigs = [
        {
          path: false,
        },
        {
          site: 'Test',
        }
      ];

      invalidConfigs.forEach(config => {
        revert = ConfigRewire.__set__(
          'loadAndParseYaml',
          sinon.stub().returns(config)
        );

        assert.throws(() => instance.update(), JSON.stringify(config));
      });
    });

    it('sorts file defaults in correct precedence order', () => {
      const root = '/root/';

      const instance = new Config('');
      instance.root = root;

      const expectedFileDefaultsOrder = [
        {
          scope: {
            metadata: {
              foo: 'bar',
            },
          },
          values: {},
        },
        {
          scope: {
            path: './'
          },
          values: {},
        },
        {
          scope: {
            path: './_posts/',
          },
          values: {},
        },
        {
          scope: {
            path: './_posts/',
            metadata: {
              foo: 'bar',
            },
          },
          values: {},
        },
        {
          scope: {
            path: './_posts/',
            metadata: {
              draft: true,
            },
          },
          values: {},
        },
        {
          scope: {
            path: './_posts/2016'
          },
          values: {},
        },
      ];

      // Test 3 random orderings.
      _.times(3, () => {
        revert = ConfigRewire.__set__(
          'loadAndParseYaml',
          sinon.stub().returns({
            ...fixture.configDefault(),
            path: {
              source: './'
            },
            file: {
              defaults: _.shuffle(expectedFileDefaultsOrder),
            },
          })
        );

        instance.update();

        instance.get('file.defaults').forEach((defaultObj, index) => {
          // Ignore index 3 and 4 as they are sorted by the order in which
          // they are given. They can be in either order depending on what
          // the _.shuffle operation does.
          // This is safe to ignore as everything else has a known expected
          // order.
          if (index === 3 || index === 4) {
            return;
          }

          const expectedObj = _.cloneDeep(expectedFileDefaultsOrder[index]);
          if (expectedObj.scope.path != null) {
            expectedObj.scope.path = path.resolve(
              root,
              expectedObj.scope.path
            );
          }

          assert.deepEqual(
            defaultObj,
            expectedObj
          );
        });
      });
    });
  });
});
