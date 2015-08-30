const assert = require('chai').assert;
const frontMatter = require('../../../lib/utils/front-matter.js');

const fixture = require('../../fixture');

describe('utils/front-matter', function() {

  describe('parse', function() {
    it('correctly takes a string and produces a json object', function() {
      assert.deepEqual(
        frontMatter.parse(fixture.frontmatterString),
        fixture.frontmatterJSON
      );
    });
  });

  describe('stringify', function() {
    it('correctly takes json object and produces a string', function() {
      assert.equal(
        frontMatter.stringify(
          fixture.frontmatterJSON.content,
          fixture.frontmatterJSON.data
        ),
        fixture.frontmatterString + '\n'
      );
    });
  });

});
