import assert from 'power-assert';
import * as yaml from '../../../lib/parse/yaml';

describe('parse/yaml', () => {
  const yamlString =
`
foo: bar
food:
- pizza
- bagel
`;

  const yamlAsObj = {
    foo: 'bar',
    food: [
      'pizza',
      'bagel',
    ],
  };

  describe('parse', () => {
    it('empty string', () => {
      assert.deepEqual(
        yaml.parse(''),
        undefined
      );
    });

    it('undefined', () => {
      assert.deepEqual(
        yaml.parse(undefined),
        'undefined'
      );
    });

    it('proper yaml string', () => {
      assert.deepEqual(
        yaml.parse(yamlString),
        yamlAsObj
      );
    });
  });
});
