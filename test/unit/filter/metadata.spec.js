import assert from 'assert';

import metadata from '../../../lib/filter/metadata';

describe('filter/metadata metadata', () => {
  it('should return true when a match is found', () => {
    assert.equal(
      metadata(
        {
          data: {
            draft: true,
            title: 'test',
          },
        },
        {
          draft: true,
        }
      ),
      true
    );

    assert.equal(
      metadata(
        {
          data: {
            draft: true,
            title: 'test',
          },
        },
        {
          draft: true,
          title: 'test',
        }
      ),
      true
    );

    assert.equal(
      metadata(
        {
          data: {
            draft: true,
            title: 'test',
            date: 'ok',
          },
        },
        {
          draft: true,
          title: 'test',
        }
      ),
      true
    );
  });

  it('should return false when a match is not found', () => {
    assert.equal(
      metadata(
        {
          data: {
            draft: false,
            title: 'test',
          },
        },
        {
          draft: true,
        }
      ),
      false
    );

    assert.equal(
      metadata(
        {
          data: {
            draft: true,
          },
        },
        {
          draft: true,
          title: 'test',
        }
      ),
      false
    );

    assert.equal(
      metadata(
        {
          data: {
            draft: true,
            title: 'surprise',
          },
        },
        {
          draft: true,
          title: 'test',
        }
      ),
      false
    );

    assert.equal(
      metadata(
        {
          data: {
            draft: true,
            title: 'surprise',
            date: 'ok',
          },
        },
        {
          draft: true,
          title: 'test',
        }
      ),
      false
    );
  });
});
