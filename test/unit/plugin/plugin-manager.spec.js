import assert from 'power-assert';
import _ from 'lodash';
import sinon from 'sinon';
import {
  createMockConfig,
} from '../../utils';
import Renderer from '../../../lib/renderer/renderer';
import PluginManager from '../../../lib/plugin/plugin-manager';

describe('plugin/plugin-manager PluginManager', () => {
  let instance;
  let config;
  let sandbox;
  let renderer;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    config = createMockConfig();

    instance = new PluginManager({ config });

    sandbox.stub(instance, 'loadFromPackageJson', _.noop);
    sandbox.stub(instance, 'loadFromDirectory', _.noop);

    renderer = new Renderer({
      pluginManager: instance,
    });

    instance.update({
      theme: {
        config: { path: { plugins: '' } },
      },
      getMarkdownEngine: renderer.getMarkdownEngine.bind(renderer),
    });
  });

  it('has expected instance methods', () => {
    assert(instance.eventHandler);
    assert(instance.pluginApi);
  });

  describe('pluginApi', () => {
    it('allows you to configure markdown engine', () => {
      assert(typeof instance.pluginApi.markdown.configure === 'function');

      instance.pluginApi.markdown.configure((md) => {
        assert.equal(md, renderer.getMarkdownEngine());
      });
    });
  });
});
