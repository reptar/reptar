import path from 'path';
import assert from 'assert';
import sinon from 'sinon';
import fs from 'fs-extra';

import {
  simpleSite,
} from '../utils';

import Reptar from '../../lib/index';
import { ApiService } from '../../lib/server/api';
import cache from '../../lib/cache';
import Config from '../../lib/config/index';
import log from '../../lib/log';

log.setSilent(true);

describe('api', function test() {
  this.timeout(5000);

  const generatedOutputDir = path.join(simpleSite.src, '_site');

  let sandbox;
  let instance;
  let apiService;
  let request;
  let reply;

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
    await instance.update();

    apiService = ApiService(instance);
  });

  beforeEach(() => {
    request = {
      query: {},
      payload: {},
      params: {},
    };
    reply = sandbox.spy();
  });

  afterEach(() => {
    reply.reset();
  });

  after(() => {
    sandbox.restore();
  });

  describe('config handlers', () => {
    beforeEach(() =>
      apiService.config.get(request, reply)
    );

    it('returns the config object', () => {
      assert(reply.firstCall.calledWith(instance.config.get()));
    });
  });

  describe('files.get handler', () => {
    let response;

    function commonAssertions({
      expectedLength,
    }) {
      it('returns an array', () => {
        assert.equal(typeof response.length, 'number');
      });

      it(`returns ${expectedLength} items`, () => {
        assert.equal(response.length, expectedLength);
      });
    }

    afterEach(() => {
      response = undefined;
    });

    describe('without any query params', () => {
      beforeEach(async () => {
        await apiService.files.get(request, reply);
        response = reply.firstCall.args[0];
      });

      commonAssertions({
        expectedLength: 14,
      });
    });

    describe('when filtered=true', () => {
      beforeEach(async () => {
        request.query = {
          filtered: 'true',
        };

        await apiService.files.get(request, reply);

        response = reply.firstCall.args[0];
      });

      commonAssertions({
        expectedLength: 1,
      });

      it('every item is filtered', () => {
        response.forEach(file =>
          assert.equal(file.filtered, true)
        );
      });
    });

    describe('when filtered=false', () => {
      beforeEach(async () => {
        request.query = {
          filtered: 'false',
        };

        await apiService.files.get(request, reply);

        response = reply.firstCall.args[0];
      });

      commonAssertions({
        expectedLength: 13,
      });

      it('every item is not filtered', () => {
        response.forEach(file =>
          assert.equal(file.filtered, false)
        );
      });
    });

    describe('when skipProcessing=true', () => {
      beforeEach(async () => {
        request.query = {
          skipProcessing: 'true',
        };

        await apiService.files.get(request, reply);

        response = reply.firstCall.args[0];
      });

      commonAssertions({
        expectedLength: 6,
      });

      it('every item is skipProcessing', () => {
        response.forEach(file =>
          assert.equal(file.skipProcessing, true)
        );
      });
    });

    describe('when skipProcessing=false', () => {
      beforeEach(async () => {
        request.query = {
          skipProcessing: 'false',
        };

        await apiService.files.get(request, reply);

        response = reply.firstCall.args[0];
      });

      commonAssertions({
        expectedLength: 8,
      });

      it('every item is skipProcessing', () => {
        response.forEach(file =>
          assert.equal(file.skipProcessing, false)
        );
      });
    });

    describe('when assetProcessor=true', () => {
      beforeEach(async () => {
        request.query = {
          assetProcessor: 'true',
        };

        await apiService.files.get(request, reply);

        response = reply.firstCall.args[0];
      });

      commonAssertions({
        expectedLength: 5,
      });

      it('every item is assetProcessor', () => {
        response.forEach(file =>
          assert(file.assetProcessor)
        );
      });
    });

    describe('when assetProcessor=false', () => {
      beforeEach(async () => {
        request.query = {
          assetProcessor: 'false',
        };

        await apiService.files.get(request, reply);

        response = reply.firstCall.args[0];
      });

      commonAssertions({
        expectedLength: 9,
      });

      it('every item is assetProcessor', () => {
        response.forEach(file =>
          assert.equal(file.assetProcessor, null)
        );
      });
    });

    describe('when path does not match a file', () => {
      beforeEach(async () => {
        request.query = {
          path: 'badabada',
        };

        await apiService.files.get(request, reply);

        response = reply.firstCall.args[0];
      });

      commonAssertions({
        expectedLength: 0,
      });
    });

    describe('when path does match a file', () => {
      let filePath;

      beforeEach(async () => {
        filePath = path.join(instance.config.get('path.source'), 'about.md');

        request.query = {
          path: filePath,
        };

        await apiService.files.get(request, reply);

        response = reply.firstCall.args[0];
      });

      commonAssertions({
        expectedLength: 1,
      });

      it('the file returned is the one we requested', () => {
        assert.equal(response[0].path, filePath);
      });
    });

    describe('when the path is relative and matches', () => {
      const filePath = 'about.md';
      let fullPath;

      beforeEach(async () => {
        fullPath = path.join(instance.config.get('path.source'), filePath);

        request.query = {
          path: filePath,
        };

        await apiService.files.get(request, reply);

        response = reply.firstCall.args[0];
      });

      commonAssertions({
        expectedLength: 1,
      });

      it('the file returned is the one we requested', () => {
        assert.equal(response[0].path, fullPath);
      });
    });

    //
    //
    describe('when destination does not match a file', () => {
      beforeEach(async () => {
        request.query = {
          destination: 'badabada',
        };

        await apiService.files.get(request, reply);

        response = reply.firstCall.args[0];
      });

      commonAssertions({
        expectedLength: 0,
      });
    });

    describe('when destination does match a file', () => {
      const filePath = '/about.html';

      beforeEach(async () => {
        request.query = {
          destination: filePath,
        };

        await apiService.files.get(request, reply);

        response = reply.firstCall.args[0];
      });

      commonAssertions({
        expectedLength: 1,
      });

      it('the file returned is the one we requested', () => {
        assert.equal(response[0].destination, filePath);
      });
    });

    describe('when the destination is relative and matches', () => {
      const filePath = 'about.html';

      beforeEach(async () => {
        request.query = {
          destination: filePath,
        };

        await apiService.files.get(request, reply);

        response = reply.firstCall.args[0];
      });

      commonAssertions({
        expectedLength: 1,
      });

      it('the file returned is the one we requested', () => {
        assert.equal(response[0].destination, `/${filePath}`);
      });
    });
  });

  describe('collections.get handler', () => {
    let response;

    function commonAssertions({
      expectedLength,
    }) {
      it('returns an array', () => {
        assert.equal(typeof response.length, 'number');
      });

      it(`returns ${expectedLength} items`, () => {
        assert.equal(response.length, expectedLength);
      });
    }

    afterEach(() => {
      response = undefined;
    });

    describe('without any query params', () => {
      beforeEach(async () => {
        await apiService.collections.get(request, reply);
        response = reply.firstCall.args[0];
      });

      commonAssertions({
        expectedLength: 2,
      });

      it('returns an array of just collection names', () => {
        assert.deepEqual(response, ['post', 'tag']);
      });
    });

    function commonOneCollection({ id }) {
      it('returns an object', () => {
        assert.equal(typeof response, 'object');
      });

      it('the object matches the request id', () => {
        assert.equal(response.id, id);
      });
    }

    describe('when requesting one collection', () => {
      const id = 'post';

      beforeEach(async () => {
        request.params.id = id;
        await apiService.collections.get(request, reply);
        response = reply.firstCall.args[0];
      });

      commonOneCollection({ id });

      it('the object does not have properties that excluded by default', () => {
        [
          'pages',
          'files',
          'data',
        ].forEach(prop =>
          assert.equal(typeof response[prop], 'undefined')
        );
      });
    });

    describe('when requesting one collection with include param', () => {
      const id = 'post';

      beforeEach(async () => {
        request.params.id = id;
        request.query.include = 'pages';
        await apiService.collections.get(request, reply);
        response = reply.firstCall.args[0];
      });

      commonOneCollection({ id });

      it('the object has a pages property which is an array', () => {
        assert.equal(typeof response.pages.length, 'number');
      });

      it('pages has expected length', () => {
        assert.equal(response.pages.length, 1);
      });

      it('the object does not have properties that excluded by default', () => {
        [
          'files',
          'data',
        ].forEach(prop =>
          assert.equal(typeof response[prop], 'undefined')
        );
      });
    });

    describe(
      'when requesting one collection with multiple include values',
    () => {
      const id = 'post';

      beforeEach(async () => {
        request.params.id = id;
        request.query.include = 'pages,files';
        await apiService.collections.get(request, reply);
        response = reply.firstCall.args[0];
      });

      commonOneCollection({ id });

      it('the object has a pages property which is an array', () => {
        assert.equal(typeof response.pages.length, 'number');
      });

      it('pages has expected length', () => {
        assert.equal(response.pages.length, 1);
      });

      it('files is an object', () => {
        assert.equal(typeof response.files, 'object');
      });

      it('files is not an array object', () => {
        assert.equal(typeof response.files.length, 'undefined');
      });

      it('the object does not have properties that excluded by default', () => {
        [
          'data',
        ].forEach(prop =>
          assert.equal(typeof response[prop], 'undefined')
        );
      });
    });
  });
});
