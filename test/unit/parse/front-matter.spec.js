import {assert} from 'chai';
import * as frontMatter from '../../../lib/parse/front-matter.js';

import fixture from '../../fixture';

describe('parse/front-matter', function() {

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
