import assert from 'power-assert';
import sinon from 'sinon';
import isObject from 'lodash/isObject';

import {
  mockSimpleSite,
  getPathToSimpleMock,
  getSimpleOneOutput,
  filterOnlyFiles,
  restoreMockFs,
} from '../fixtures';
import fs from 'fs-extra';

import Yarn from '../../lib/index.js';
import Config, {
  EVENTS,
} from '../../lib/config/index.js';
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
  });

  afterEach(() => {
    sandbox.restore();
    restoreMockFs();
  });

  it('instantiates correctly', function() {
    sandbox.spy(Yarn.prototype, 'configUpdated');
    sandbox.spy(Config.prototype, 'setRoot');
    sandbox.spy(Config.prototype, 'on');
    sandbox.spy(Theme.prototype, 'setGetConfig');

    let instance = new Yarn({
      rootPath: getPathToSimpleMock()
    });
    assert.equal(instance.configUpdated.callCount, 1);

    assert(instance.config instanceof Config);
    assert.equal(instance.config.setRoot.callCount, 1);
    assert.equal(instance.config.on.callCount, 1);
    assert(instance.config.on.calledWith(EVENTS.CONFIG_UPDATED));

    assert(instance.theme instanceof Theme);
    assert.equal(instance.theme.setGetConfig.callCount, 1);

    assert(isObject(instance.files));
    assert(isObject(instance.collections));
    assert(isObject(instance.data));
    assert(isObject(instance.data.collections));
  });

  it('builds site correctly', async function() {
    sandbox.spy(fs, 'outputFileAsync');

    // Build site.
    let instance = new Yarn({
      rootPath: getPathToSimpleMock()
    });
    await instance.loadState();
    await instance.build();

    for (let i = 0; i < fs.outputFileAsync.callCount; i++) {
      let fileDestination = fs.outputFileAsync.getCall(i).args[0];
      let fileDestinationRelative = fileDestination.replace(/(.*)_site\//, '');
      let fileWritten = fs.outputFileAsync.getCall(i).args[1];

      // Make sure what Yarn built matches what we expect it to have built.
      assert.equal(fileWritten, simpleOneOutput[fileDestinationRelative]);
    }
  });

});
