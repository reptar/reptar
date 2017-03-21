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
  beforeEach(async () => {
    sandbox = sinon.sandbox.create();

    // Don't actually save cache to file system.
    sandbox.stub(cache, 'save');

    fs.removeSync(generatedOutputDir);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('instantiates correctly', async () => {
    sandbox.spy(Reptar.prototype, 'update');
    sandbox.spy(Config.prototype, 'update');

    const instance = new Reptar({
      rootPath: simpleSite.src,
    });
    assert.equal(instance.update.callCount, 0);

    await instance.update();
    assert.equal(instance.update.callCount, 1);

    assert(instance.config instanceof Config);
    assert.equal(instance.config.update.callCount, 1);

    assert(instance.theme instanceof Theme);

    assert(_.isObject(instance.fileSystem.files));
    assert(_.isObject(instance.metadata.get()));
    assert(_.isObject(instance.metadata.get('collections')));
  });

  it('builds site correctly', async () => {
    // Build site.
    const instance = new Reptar({
      rootPath: simpleSite.src,
    });
    await instance.update();
    await instance.build();

    function makePathsRelative(basePath) {
      return allPaths => allPaths.reduce((acc, absPath) => {
        const relativePath = absPath.replace(basePath, '');
        acc[relativePath] = absPath;
        return acc;
      }, {});
    }

    const expectedFiles = await getAllFilePaths(simpleSite.expected)
      .then(makePathsRelative(simpleSite.expected));

    const generatedFiles = await getAllFilePaths(generatedOutputDir)
      .then(makePathsRelative(generatedOutputDir));

    assert.deepEqual(Object.keys(expectedFiles), Object.keys(generatedFiles));
    assert.equal(expectedFiles.length, generatedFiles.length);

    _.forEach(expectedFiles, (absolutePath, relativePath) => {
      const generatedAbsolutePath = generatedFiles[relativePath];

      const expectedFile = fs.readFileSync(absolutePath, 'utf8');
      const generatedFile = fs.readFileSync(generatedAbsolutePath, 'utf8');

      assert.equal(generatedFile, expectedFile);
    });
  });
});
