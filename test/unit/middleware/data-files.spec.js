import assert from 'power-assert';
import path from 'path';
import { readDataFiles } from '../../../lib/middleware/data-files';

describe('middleware/data-files DataFiles', () => {
  describe('update', () => {
    it('returns empty object when no data objects found', async () => {
      const result = await readDataFiles('foo');

      assert.deepEqual(result, {});
    });

    it('works', async () => {
      const dataPath = path.resolve(
        __dirname,
        '../../fixtures/simple/_data'
      );
      const result = await readDataFiles(dataPath);

      assert.deepEqual(result, {
        cities: [
          {
            name: 'New York City',
            cuisine: 'bagel',
          },
          {
            name: 'Los Angeles',
            cuisine: 'kale',
          },
          {
            name: 'New Orleans',
            cuisine: 'beignets',
          },
        ],
        friends: {
          'angelica': {
            name: 'Angelica',
            birthday: 'May 12, 1988',
          },
          chuckie: {
            name: 'Chuckie',
            birthday: 'April 15, 1989',
          },
          tommy: {
            name: 'Tommy',
            birthday: 'June 11th, 1990',
          },
        },
      });
    });
  });
});
