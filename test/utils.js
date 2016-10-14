import rewire from 'rewire';
const ConfigRewire = rewire('../lib/config/index.js');
const Config = ConfigRewire.default;

export function createMockConfig(config = {}) {
  ConfigRewire.__set__('loadAndParseYaml', () => config);
  const instance = new Config('');
  instance.update();
  return instance;
}
