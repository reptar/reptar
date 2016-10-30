import FileSystemCollection from './type/file-system';
import MetadataCollection from './type/metadata';

// eslint-disable-next-line import/prefer-default-export
export function createCollection(name, collectionConfig, getConfig) {
  if (collectionConfig.metadata) {
    return new MetadataCollection(name, collectionConfig, getConfig);
  }

  return new FileSystemCollection(name, collectionConfig, getConfig);
}
