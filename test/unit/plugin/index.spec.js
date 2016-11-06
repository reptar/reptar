import assert from 'power-assert';

import Plugin from '../../../lib/plugin/index';

describe('plugin/index Plugin', () => {
  it('has expected public methods', () => {
    assert(typeof Plugin.API === 'object');
  });
});
