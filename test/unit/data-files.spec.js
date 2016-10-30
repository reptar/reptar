import assert from 'power-assert';
import path from 'path';
import DataFiles from '../../lib/data-files';

describe('data-files DataFiles', () => {
  describe('update', () => {
    it('returns empty object when no data objects found', async () => {
      const result = await DataFiles.update('foo');

      assert.deepEqual(result, {});
    });

    it('works', async () => {
      const dataPath = path.resolve(
        __dirname,
        '../fixtures/simple/_data'
      );
      const result = await DataFiles.update(dataPath);

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
