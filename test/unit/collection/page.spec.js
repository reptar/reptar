import {assert} from 'chai';
import sinon from 'sinon';

import fixture from '../../fixture';

import CollectionPage from '../../../lib/collection/page.js';

describe('collection/page CollectionPage', () => {

  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('can create an instance', () => {
      assert.ok(new CollectionPage());
    });

    it('causes calculateDestination to be called', () => {
      sandbox.spy(CollectionPage.prototype, 'calculateDestination');

      let instance = new CollectionPage();
      assert.ok(instance.calculateDestination.calledOnce);
    });

    it('saves passed in values', () => {
      let data = {};
      let permalink = 'hello';
      let files = fixture.collectionFiles();

      let instance = new CollectionPage(
        files,
        permalink,
        data
      );

      assert.deepEqual(instance.data, data);
      assert.deepEqual(instance.permalink, permalink);
      assert.deepEqual(instance.data.files, files.map(file => file.data));
    });
  });

  it('TODO: calculateDestination', () => {
    assert.ok('TODO');
  });

});
