import path from 'path';
import assert from 'assert';
import sinon from 'sinon';
import _ from 'lodash';
import fs from 'fs-extra';

import {
  getAllFilePaths,
  simpleSite,
} from '../utils';

import Reptar from '../../lib/index';
import cache from '../../lib/cache';
import Theme from '../../lib/theme/index';
import Config from '../../lib/config/index';
import log from '../../lib/log';

log.setSilent(true);

describe('reptar Reptar', function test() {
  this.timeout(5000);

  const generatedOutputDir = path.join(simpleSite.src, '_site');

  let sandbox;
  let instance;

  before(async () => {
    sandbox = sinon.sandbox.create();

    // Don't actually save cache to file system.
    sandbox.stub(cache, 'save');

    fs.removeSync(generatedOutputDir);

    sandbox.spy(Reptar.prototype, 'update');
    sandbox.spy(Config.prototype, 'update');

    instance = new Reptar({
      rootPath: simpleSite.src,
      showSpinner: false,
    });

    instance._test = {
      middlewares: [],
      lifecycle: {
        willUpdate: [],
        didUpdate: [],
        willBuild: [],
        didBuild: [],
      },
    };
  });

  after(() => {
    sandbox.restore();
  });

  it('does not call update', async () => {
    assert.equal(instance.update.callCount, 0);
  });

  it('has not called any middleware functions', () => {
    assert(_.isArray(instance._test.middlewares));
    assert.equal(instance._test.middlewares.length, 0);
  });

  it('has not called any lifecycle functions', () => {
    _.forEach(instance._test.lifecycle, (val) => {
      assert(_.isArray(val));
      assert.equal(val.length, 0);
    });
  });

  describe('when updated', () => {
    before(async () => {
      await instance.update();
    });

    it('creates expected instances', async () => {
      assert.equal(instance.update.callCount, 1);

      assert(instance.config instanceof Config);
      assert.equal(instance.config.update.callCount, 1);

      assert(instance.theme instanceof Theme);

      assert(_.isObject(instance.fileSystem.files));
      assert(_.isObject(instance.metadata.get()));
      assert(_.isObject(instance.metadata.get('collections')));
    });

    it('calls every middleware function', () => {
      assert.equal(
        instance._test.middlewares.length,
        instance.config.get('middlewares').length
      );
    });

    it('calls every middleware function in the expected order', () => {
      _.reduce(instance._test.middlewares, (prevValue, nextValue) => {
        assert(nextValue > prevValue);
        return nextValue;
      });
    });

    it('willUpdate is called before didUpdate', () => {
      const {
        willUpdate,
        didUpdate,
      } = instance._test.lifecycle;

      assert(willUpdate[0] < didUpdate[0]);
    });

    it('didUpdate is called before the first middleware', () => {
      const {
        didUpdate,
      } = instance._test.lifecycle;

      assert(didUpdate[0] < instance._test.middlewares[0]);
    });

    it('willBuild is not called', () => {
      assert.equal(instance._test.lifecycle.willBuild, 0);
    });

    it('didBuild is not called', () => {
      assert.equal(instance._test.lifecycle.didBuild, 0);
    });

    describe('and when build is called', () => {
      function makePathsRelative(basePath) {
        return allPaths => allPaths.reduce((acc, absPath) => {
          const relativePath = absPath.replace(basePath, '');
          acc[relativePath] = absPath;
          return acc;
        }, {});
      }

      let expectedFiles;
      let generatedFiles;

      before(async () => {
        await instance.build();

        expectedFiles = await getAllFilePaths(simpleSite.expected)
          .then(makePathsRelative(simpleSite.expected));

        generatedFiles = await getAllFilePaths(generatedOutputDir)
          .then(makePathsRelative(generatedOutputDir));
      });

      it('has the same number of files generated', () => {
        assert.deepEqual(
          Object.keys(expectedFiles),
          Object.keys(generatedFiles)
        );
        assert.equal(expectedFiles.length, generatedFiles.length);
      });

      it('builds site correctly', async () => {
        _.forEach(expectedFiles, (absolutePath, relativePath) => {
          const generatedAbsolutePath = generatedFiles[relativePath];

          const expectedFile = fs.readFileSync(absolutePath, 'utf8');
          const generatedFile = fs.readFileSync(generatedAbsolutePath, 'utf8');

          assert.equal(generatedFile, expectedFile);
        });
      });

      it('last middleware is called before willBuild', () => {
        const {
          willBuild,
        } = instance._test.lifecycle;

        const lastMiddleware = instance._test.middlewares[
          instance._test.middlewares.length - 1
        ];

        assert(lastMiddleware < willBuild[0]);
      });

      it('willBuild is called before didBuild', () => {
        const {
          willBuild,
          didBuild,
        } = instance._test.lifecycle;

        assert(willBuild[0] < didBuild[0]);
      });
    });
  });
});
