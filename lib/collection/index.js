import FileSystemCollection from './type/file-system';
import MetadataCollection from './type/metadata';

export function createCollection(name, collectionConfig, getConfig) {
  if (collectionConfig.metadata) {
    return new MetadataCollection(name, collectionConfig, getConfig);
  } else {
    return new FileSystemCollection(name, collectionConfig, getConfig);
  }
}
