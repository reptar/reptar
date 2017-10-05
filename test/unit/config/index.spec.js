import assert from 'assert';
import rewire from 'rewire';
import sinon from 'sinon';
import path from 'path';
import _ from 'lodash';

import fixture from '../../fixture';
import { simpleSite } from '../../utils';

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

    function calculatePathsCorrectly({ instance, rootPath }) {
      const expectedConfig = fixture.configDefault();

      assert.equal(
        instance._raw.path.source,
        path.resolve(rootPath + expectedConfig.path.source)
      );

      assert.equal(
        instance._raw.path.destination,
        path.resolve(
          rootPath +
            expectedConfig.path.source +
            expectedConfig.path.destination
        )
      );

      _.each(instance.path, (val, key) => {
        assert.equal(instance.path[key], instance._raw.path[key]);
      });
    }

    it('can load a config file that exports a function', () => {
      const rootPath = '/root/';

      const instance = new Config('');
      instance.root = rootPath;

      revert = ConfigRewire.__set__(
        'loadConfigFile',
        sinon.stub().returns(() => fixture.configDefault())
      );

      instance.update();

      calculatePathsCorrectly({ instance, rootPath });
    });

    it('calculates paths correctly', () => {
      const rootPath = '/root/';

      const instance = new Config('');
      instance.root = rootPath;

      revert = ConfigRewire.__set__(
        'loadConfigFile',
        sinon.stub().returns(fixture.configDefault())
      );

      instance.update();

      calculatePathsCorrectly({ instance, rootPath });
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
        },
      ];

      invalidConfigs.forEach(config => {
        revert = ConfigRewire.__set__(
          'loadConfigFile',
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
            path: './',
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
            path: './_posts/2016',
          },
          values: {},
        },
      ];

      // Test 3 random orderings.
      _.times(3, () => {
        revert = ConfigRewire.__set__(
          'loadConfigFile',
          sinon.stub().returns({
            ...fixture.configDefault(),
            path: {
              source: './',
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
            expectedObj.scope.path = path.resolve(root, expectedObj.scope.path);
          }

          assert.deepEqual(defaultObj, expectedObj);
        });
      });
    });

    it('coerces middleware and lifecycle config values to arrays', () => {
      const instance = new Config('');
      instance.root = simpleSite.src;

      const rawConfig = {
        middlewares: 'fake-module',
        lifecycle: {
          willUpdate: _.noop,
          didUpdate: ['my-middleware'],
        },
      };

      revert = ConfigRewire.__set__(
        'loadConfigFile',
        sinon.stub().returns(rawConfig)
      );

      instance.update();

      assert(_.isArray(instance.get('middlewares')));
      assert.equal(typeof instance.get('middlewares[0]'), 'function');

      assert(_.isArray(instance.get('lifecycle.willUpdate')));
      assert.equal(typeof instance.get('lifecycle.willUpdate[0]'), 'function');

      assert(_.isArray(instance.get('lifecycle.didUpdate')));
      assert.equal(typeof instance.get('lifecycle.didUpdate[0]'), 'function');
    });

    describe('asset', () => {
      let instance;

      beforeEach(() => {
        instance = new Config('');
        instance.root = simpleSite.src;

        const rawConfig = {
          assets: [
            {
              test: 'jsx',
              use: 'browserify',
            },
            {
              test: /\.js$/,
              use: 'browserify',
            },
            {
              test: /\.s[ac]ss$/,
              use: {
                calculateDestination: () => {},
                render: () => {},
              },
            },
            {
              test: '/abs/pathjs.gif',
              use: 'browserify',
            },
          ],
        };

        revert = ConfigRewire.__set__(
          'loadConfigFile',
          sinon.stub().returns(rawConfig)
        );

        instance.update();
      });

      it('coerces asset test values to functions', () => {
        instance.get('assets').forEach(asset => {
          assert(_.isFunction(asset.test));
        });
      });

      it('ensures asset.use value is a function', () => {
        instance.get('assets').forEach(asset => {
          assert(_.isObject(asset.use));
        });
      });

      it('correctly tests against different file paths', () => {
        [
          ['/foo/bar.js', true],
          ['/foo/bar.min.js', true],
          ['/foo/bar.jsx', false],
          ['/js/bar.jsx', false],
          ['/foo/ternjs.gif', false],
          ['/abs/pathjs.gif', true],
          ['/foo/bar.sass', true],
          ['/foo/bar.css', false],
        ].forEach(([filePath, expectedValue]) => {
          const actualValue = instance
            .get('assets')
            .some(asset => asset.test(filePath));

          assert.equal(
            actualValue,
            expectedValue,
            `${filePath} did not test as ${expectedValue}`
          );
        });
      });
    });
  });
});
