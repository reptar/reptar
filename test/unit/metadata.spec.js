import assert from 'power-assert';
import sinon from 'sinon';

import { createMockConfig } from '../utils';

import Metadata from '../../lib/metadata';

describe('metadata Metadata', () => {
  let config;
  let getConfig;

  let sandbox;
  beforeEach(() => {
    config = createMockConfig();
    getConfig = () => config;

    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('get', () => {
    let instance;
    let testVal;

    beforeEach(() => {
      instance = new Metadata(getConfig);
      testVal = { foo: 'bar' };
      instance.set('test', testVal);
    });

    it('returns the entire object', async () => {
      assert.deepEqual(instance.get(), instance.metadata);
    });

    it('returns the object at a path', async () => {
      assert.deepEqual(instance.get('test'), testVal);
    });
  });
});
