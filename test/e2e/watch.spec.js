import assert from 'power-assert';
import sinon from 'sinon';
import fs from 'fs';
import each from 'lodash/each';

import {
  getPathToScaffold,
} from '../utils';
import Yarn from '../../lib/index.js';

describe('Yarn watches for updates', function() {
  this.timeout(5000);

  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  function createNewFilePath(filePath) {
    let parts = filePath.split('/');
    let partsLength = parts.length;

    parts[partsLength - 1] = 'dummy-file.md';

    return parts.join('/');
  }

  describe('can re-render html when a file changes', () => {
    it('is a noop if an invalid path is given', async () => {
      let instance = new Yarn(getPathToScaffold());
      await instance.loadState();

      let postCollection = instance.collections.post;

      sinon.spy(postCollection, 'writeFile');
      sinon.spy(postCollection, 'writePage');

      // Run function.
      await instance.fileChanged();

      assert.equal(postCollection.writeFile.called, false);
      assert.equal(postCollection.writePage.called, false);

      // Run function.
      await instance.fileChanged('random spam');

      assert.equal(postCollection.writeFile.called, false);
      assert.equal(postCollection.writePage.called, false);
    });

    it('will re-write individual file and collection html', async () => {
      let instance = new Yarn(getPathToScaffold());
      await instance.loadState();

      let postCollection = instance.collections.post;
      let postPage = postCollection.pages[0];
      let postFile;
      each(postCollection.files, (file) => {
        postFile = file;
        return false;
      });

      let previousData = postFile.data;

      sinon.spy(postFile, 'updateDataFromFileSystem');
      sinon.spy(postCollection, 'writeFile');
      sinon.spy(postCollection, 'writePage');

      // Run function.
      await instance.fileChanged(postFile.path);

      assert.equal(postFile.updateDataFromFileSystem.calledOnce, true);
      assert.ok(postCollection.writeFile.calledWith(postFile, instance.data));
      assert.ok(postCollection.writePage.calledWith(postPage, instance.data));

      assert.strictEqual(previousData, postFile.data, 'Make sure File ' +
        'retains its same Object instance.');
    });
  });

  describe('handles when a file is added to the project', () => {
    it('is a noop if file path already exists', async () => {
      let instance = new Yarn(getPathToScaffold());
      await instance.loadState();

      let postCollection = instance.collections.post;
      let postFile;
      each(postCollection.files, (file) => {
        postFile = file;
        return false;
      });

      sinon.spy(postCollection, 'addFile');
      sinon.spy(postCollection, 'createCollectionPages');
      sinon.spy(postCollection, 'writeFile');
      sinon.spy(postCollection, 'writePage');

      // Run function.
      let newFile = await instance.fileAdded(postFile.path);

      assert.equal(newFile, false);
      assert.equal(postCollection.addFile.called, false);
      assert.equal(postCollection.createCollectionPages.called, false);
      assert.equal(postCollection.writeFile.called, false);
    });

    it('will re-render when a file is added', async () => {
      let instance = new Yarn(getPathToScaffold());
      await instance.loadState();

      let postCollection = instance.collections.post;
      let postFile;
      each(postCollection.files, (file) => {
        postFile = file;
        return false;
      });

      sinon.spy(instance, 'writeFile');
      sinon.spy(postCollection, 'addFile');
      sinon.spy(postCollection, 'createCollectionPages');
      sinon.spy(postCollection, 'writeFile');
      sinon.spy(postCollection, 'writePage');

      let copiedFile = {
        path: createNewFilePath(postFile.path),
        rawContent: postFile.rawContent
      };

      // Add new file.
      fs.writeFileSync(copiedFile.path, copiedFile.rawContent, 'utf8');

      // Run function.
      let newFile = await instance.fileAdded(copiedFile.path);

      assert.equal(instance.writeFile.called, true);
      assert.ok(instance.writeFile.calledWith(newFile));

      assert.equal(postCollection.addFile.called, true);
      assert.equal(postCollection.createCollectionPages.called, true);
      assert.ok(postCollection.writeFile.calledWith(newFile, instance.data));

      // Delete created file.
      fs.unlinkSync(copiedFile.path);
    });
  });

  describe('handles when a file is removed from project', () => {
    it('is a noop if file path does not exist', async () => {
      let instance = new Yarn(getPathToScaffold());
      await instance.loadState();

      let postCollection = instance.collections.post;
      let postFile;
      each(postCollection.files, (file) => {
        postFile = file;
        return false;
      });

      sinon.spy(postCollection, 'addFile');
      sinon.spy(postCollection, 'createCollectionPages');
      sinon.spy(postCollection, 'writeFile');
      sinon.spy(postCollection, 'writePage');

      // Run function.
      let newFile = await instance.fileRemoved(postFile.path + 'derp');

      assert.equal(newFile, false);
      assert.equal(postCollection.addFile.called, false);
      assert.equal(postCollection.createCollectionPages.called, false);
      assert.equal(postCollection.writeFile.called, false);
    });

    it('will re-render when a file is removed', async () => {
      let instance = new Yarn(getPathToScaffold());
      await instance.loadState();

      let postCollection = instance.collections.post;
      let postFile;
      each(postCollection.files, (file) => {
        postFile = file;
        return false;
      });

      sinon.spy(postCollection, 'removeFile');
      sinon.spy(postCollection, 'createCollectionPages');
      sinon.spy(postCollection, 'writeFile');
      sinon.spy(postCollection, 'writePage');

      let copiedFile = {
        path: createNewFilePath(postFile.path),
        rawContent: postFile.rawContent
      };

      // Add new file.
      fs.writeFileSync(copiedFile.path, copiedFile.rawContent, 'utf8');

      // Re-read files with added file already present.
      await instance.loadState();

      let fileRemoved;
      each(postCollection.files, (file) => {
        if (file.path === copiedFile.path) {
          fileRemoved = file;
          return false;
        }
      });

      // Delete created file.
      fs.unlinkSync(copiedFile.path);

      // Run function.
      await instance.fileRemoved(fileRemoved.path);

      let postPage = postCollection.pages[0];

      assert.equal(postCollection.removeFile.called, true);
      assert.equal(postCollection.createCollectionPages.called, true);
      assert.equal(postCollection.writePage.called, true);
      assert.ok(postCollection.writePage.calledWith(postPage, instance.data));
    });
  });
});
