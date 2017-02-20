import FileSystemCollection from './type/file-system';
import MetadataCollection from './type/metadata';

// eslint-disable-next-line import/prefer-default-export
export function createCollection(name, collectionConfig, config, renderer) {
  if (collectionConfig.metadata) {
    return new MetadataCollection(name, collectionConfig, config, renderer);
  }

  return new FileSystemCollection(name, collectionConfig, config, renderer);
}
