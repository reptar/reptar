import assert from 'power-assert';

import futureDate from '../../../lib/filter/future-date.js';

describe('filter/future-date futureDate', () => {

  it('should default to use date as key value', () => {
    assert.equal(futureDate({
      data: {
        date: Date.now() - 1000
      }
    }), false);

    assert.equal(futureDate({
      data: {
        date: Date.now() + 1000
      }
    }), true);

    assert.equal(futureDate({
      data: {
        dateKey: Date.now() + 1000
      }
    }), false);
  });

  it('should allow setting of what date key to use', () => {
    assert.equal(futureDate({
      data: {
        whee: Date.now() - 1000
      }
    }, {key: 'whee'}), false);

    assert.equal(futureDate({
      data: {
        whee: Date.now() + 1000
      }
    }, {key: 'whee'}), true);

    assert.equal(futureDate({
      data: {
        date: Date.now() + 1000
      }
    }, {key: 'whee'}), false);
  });
});
