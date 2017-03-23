import assert from 'assert';

import filter from '../../../lib/filter/index';

describe('filter/index', () => {
  const mockFile = {
    data: {
      date: '2027-2-28',
      foo: 'bar',
    },
  };

  it('isFileFiltered', () => {
    assert.equal(filter.isFileFiltered({}, mockFile), false);
    assert.equal(filter.isFileFiltered({
      future_date: {
        key: 'foo',
      },
    }, mockFile), false);
    assert.equal(filter.isFileFiltered({
      future_date: {
        key: 'date',
      },
    }, mockFile), true);
    assert.equal(filter.isFileFiltered({
      metadata: {
        foo: 'date',
      },
    }, mockFile), false);
    assert.equal(filter.isFileFiltered({
      metadata: {
        foo: 'bar',
      },
    }, mockFile), true);
  });
});
