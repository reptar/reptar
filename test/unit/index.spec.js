import {assert} from 'chai';
import sinon from 'sinon';
import path from 'path';

import Yarn from '../../lib/index.js';

describe('index Yarn', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('writeFile', () => {
    it('is a noop if an invalid path is given', async () => {
      let instance = new Yarn(path.resolve(__dirname, '../../scaffold'));
      await instance.readFiles();

      let postCollection = instance.collections.post;

      sinon.spy(postCollection, 'writeFile');
      sinon.spy(postCollection, 'writePage');

      // Run function.
      await instance.writeFile();

      assert.equal(postCollection.writeFile.called, false);
      assert.equal(postCollection.writePage.called, false);

      // Run function.
      await instance.writeFile('random spam');

      assert.equal(postCollection.writeFile.called, false);
      assert.equal(postCollection.writePage.called, false);
    });

    it('can discretely update a file', async () => {
      let instance = new Yarn(path.resolve(__dirname, '../../scaffold'));
      await instance.readFiles();

      let postCollection = instance.collections.post;
      let postPage = postCollection.pages[0];
      let postFile = postCollection.files[0];

      let previousData = postFile.data;

      sinon.spy(postFile, 'updateDataFromFileSystem');
      sinon.spy(postCollection, 'writeFile');
      sinon.spy(postCollection, 'writePage');

      // Run function.
      await instance.writeFile(postFile.path);

      assert.equal(postFile.updateDataFromFileSystem.calledOnce, true);
      assert.ok(postCollection.writeFile.calledWith(postFile, instance.data));
      assert.ok(postCollection.writePage.calledWith(postPage, instance.data));

      assert.strictEqual(previousData, postFile.data, 'Make sure File ' +
        'retains its same Object instance.');
    });
  });
});
