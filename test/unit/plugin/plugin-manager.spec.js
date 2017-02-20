import assert from 'power-assert';

import PluginManager from '../../../lib/plugin/plugin-manager';

describe('plugin/plugin-manager PluginManager', () => {
  let instance;

  beforeEach(() => {
    instance = new PluginManager();
  });

  it('has expected instance methods', () => {
    assert(instance.eventHandler);
    assert(instance.pluginApi);
  });
});
