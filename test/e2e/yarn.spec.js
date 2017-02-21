import assert from 'power-assert';
import sinon from 'sinon';
import _ from 'lodash';

import {
  mockSimpleSite,
  getPathToSimpleMock,
  getSimpleOneOutput,
  filterOnlyFiles,
  restoreMockFs,
} from '../fixtures';
import fs from 'fs-extra'; // eslint-disable-line import/first

import Reptar from '../../lib/index';
import cache from '../../lib/cache';
import Config from '../../lib/config/index';
import Theme from '../../lib/theme/index';
import log from '../../lib/log';

import { createMarkdownEngine } from '../../lib/renderer/markdown';

// TODO(hswolff): We create the markdown instance here to prevent mockFs from
// preventing the Markdown library from requiring its library.
// We shouldn't have to rely on this behavior.
// Removing this line will require us to properly mock the directories that
// markdown-it depend on.
createMarkdownEngine();

log.setSilent(true);

describe('reptar Reptar', function test() {
  this.timeout(5000);

  let sandbox;
  let simpleOneOutput;
  beforeEach(async () => {
    sandbox = sinon.sandbox.create();
    simpleOneOutput = await getSimpleOneOutput();
    simpleOneOutput = filterOnlyFiles(simpleOneOutput);
    await mockSimpleSite();

    // Don't actually save cache to file system.
    sandbox.stub(cache, 'save');
    sandbox.stub(fs, 'copy', (path, dest, cb) => setTimeout(cb, 0));
  });

  afterEach(() => {
    sandbox.restore();
    restoreMockFs();
  });

  it('instantiates correctly', async () => {
    sandbox.spy(Reptar.prototype, 'update');
    sandbox.spy(Config.prototype, 'update');

    const instance = new Reptar({
      rootPath: getPathToSimpleMock(),
    });
    assert.equal(instance.update.callCount, 0);

    await instance.update();
    assert.equal(instance.update.callCount, 1);

    assert(instance.config instanceof Config);
    assert.equal(instance.config.update.callCount, 1);

    assert(instance.theme instanceof Theme);

    assert(_.isObject(instance.fileSystem.files));
    assert(_.isObject(instance.collections));
    assert(_.isObject(instance.metadata.get()));
    assert(_.isObject(instance.metadata.get('collections')));
  });

  it('builds site correctly', async () => {
    sandbox.spy(fs, 'outputFile');

    // Build site.
    const instance = new Reptar({
      rootPath: getPathToSimpleMock(),
    });
    await instance.update();
    await instance.build();

    assert(fs.outputFile.callCount > 0);

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < fs.outputFile.callCount; i++) {
      const fileDestination = fs.outputFile.getCall(i).args[0];
      const fileDestinationRelative = fileDestination.replace(
        /(.*)_site\//, ''
      );
      const fileWritten = fs.outputFile.getCall(i).args[1];

      // Make sure what Reptar built matches what we expect it to have built.
      assert.equal(fileWritten, simpleOneOutput[fileDestinationRelative]);
    }
  });
});
