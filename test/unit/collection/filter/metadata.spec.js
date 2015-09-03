import {assert} from 'chai';

import metadata from '../../../../lib/collection/filter/metadata.js';

describe('collection/filter/metadata metadata', () => {

  it('should return true when a match is found', () => {
    metadata.reset();
    assert.equal(metadata({
      data: {
        draft: true,
        title: 'test'
      }
    }, {
      draft: true
    }), true);

    metadata.reset();
    assert.equal(metadata({
      data: {
        draft: true,
        title: 'test'
      }
    }, {
      draft: true,
      title: 'test'
    }), true);

    metadata.reset();
    assert.equal(metadata({
      data: {
        draft: true,
        title: 'test',
        date: 'ok'
      }
    }, {
      draft: true,
      title: 'test'
    }), true);
  });

  it('should return false when a match is not found', () => {
    metadata.reset();
    assert.equal(metadata({
      data: {
        draft: false,
        title: 'test'
      }
    }, {
      draft: true
    }), false);

    metadata.reset();
    assert.equal(metadata({
      data: {
        draft: true
      }
    }, {
      draft: true,
      title: 'test'
    }), false);

    metadata.reset();
    assert.equal(metadata({
      data: {
        draft: true,
        title: 'surprise'
      }
    }, {
      draft: true,
      title: 'test'
    }), false);

    metadata.reset();
    assert.equal(metadata({
      data: {
        draft: true,
        title: 'surprise',
        date: 'ok'
      }
    }, {
      draft: true,
      title: 'test'
    }), false);
  });
});
