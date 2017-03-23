import assert from 'assert';
import * as frontMatter from '../../../lib/parse/front-matter';

import fixture from '../../fixture';

describe('parse/front-matter', () => {
  describe('parse', () => {
    it('correctly takes a string and produces a json object', () => {
      assert.deepEqual(
        frontMatter.parse(fixture.frontmatterString),
        fixture.frontmatterJSON
      );
    });
  });

  describe('stringify', () => {
    it('correctly takes json object and produces a string', () => {
      assert.equal(
        frontMatter.stringify(
          fixture.frontmatterJSON.content,
          fixture.frontmatterJSON.data
        ),
        `${fixture.frontmatterString}\n`
      );
    });
  });
});
