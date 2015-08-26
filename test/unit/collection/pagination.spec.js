const assert = require('chai').assert;
const sinon = require('sinon');

const CollectionPagination = require('../../../lib/collection/pagination.js');

describe('collection/page CollectionPagination', () => {

  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('can create an instance with no arguments', () => {
      let instance = new CollectionPagination();
      assert.ok(instance);

      assert.isUndefined(instance.layout);
      assert.equal(instance.size, 6);
      assert.isUndefined(instance.permalink_index);
      assert.isUndefined(instance.permalink_page);
    });

    it('can create an instance with arguments', () => {
      let data = {
        layout: 'myLayout',
        size: 2,
        permalink_index: 'oh joy',
        permalink_page: 'a page as well'
      };

      let instance = new CollectionPagination(data);
      assert.ok(instance);

      assert.equal(instance.layout, data.layout);
      assert.equal(instance.size, data.size);
      assert.equal(instance.permalinkIndex, data.permalink_index);
      assert.equal(instance.permalinkPage, data.permalink_page);
    });
  });
});
