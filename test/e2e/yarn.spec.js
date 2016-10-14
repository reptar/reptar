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
import fs from 'fs-extra';

import Yarn from '../../lib/index.js';
import cache from '../../lib/cache.js';
import Config from '../../lib/config/index.js';
import Theme from '../../lib/theme/index.js';

import log from '../../lib/log.js';
log.setSilent(true);

describe('yarn Yarn', function() {
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

  it('instantiates correctly', async function() {
    sandbox.spy(Yarn.prototype, 'update');
    sandbox.spy(Config.prototype, 'update');
    sandbox.spy(Theme.prototype, 'setGetConfig');

    const instance = new Yarn({
      rootPath: getPathToSimpleMock()
    });
    assert.equal(instance.update.callCount, 0);

    await instance.update();
    assert.equal(instance.update.callCount, 1);

    assert(instance.config instanceof Config);
    assert.equal(instance.config.update.callCount, 1);

    assert(instance.theme instanceof Theme);
    assert.equal(instance.theme.setGetConfig.callCount, 1);

    assert(_.isObject(instance.files));
    assert(_.isObject(instance.collections));
    assert(_.isObject(instance.data));
    assert(_.isObject(instance.data.collections));
  });

  it('builds site correctly', async function() {
    sandbox.spy(fs, 'outputFileAsync');

    // Build site.
    const instance = new Yarn({
      rootPath: getPathToSimpleMock()
    });
    await instance.update();
    await instance.build();

    for (let i = 0; i < fs.outputFileAsync.callCount; i++) {
      const fileDestination = fs.outputFileAsync.getCall(i).args[0];
      const fileDestinationRelative = fileDestination.replace(
        /(.*)_site\//, ''
      );
      const fileWritten = fs.outputFileAsync.getCall(i).args[1];

      // Make sure what Yarn built matches what we expect it to have built.
      assert.equal(fileWritten, simpleOneOutput[fileDestinationRelative]);
    }
  });

});
