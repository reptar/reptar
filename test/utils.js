// eslint-disable-next-line import/no-extraneous-dependencies
import rewire from 'rewire';

const ConfigRewire = rewire('../lib/config/index.js');
const Config = ConfigRewire.default;

// eslint-disable-next-line import/prefer-default-export
export function createMockConfig(config = {}) {
  ConfigRewire.__set__('loadAndParseYaml', () => config);
  const instance = new Config('');
  instance.update();
  return instance;
}
