const assert = require('assert');
const frontMatter = require('../../lib/utils/front-matter.js');

const stub = require('../stub');


describe('utils/front-matter', function() {

  describe('parse', function() {
    it('correctly takes a string and produces a json object', function() {
      assert.deepEqual(
        frontMatter.parse(stub.frontmatterString),
        stub.frontmatterJSON
      );
    });
  });

  describe('stringify', function() {
    it('correctly takes json object and produces a string', function() {
      assert.equal(
        frontMatter.stringify(
          stub.frontmatterJSON.content,
          stub.frontmatterJSON.data
        ),
        stub.frontmatterString + '\n'
      );
    });
  });

});
