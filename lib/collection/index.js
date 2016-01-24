import FileSystemCollection from './type/file-system';
import MetadataCollection from './type/metadata';
import StaticCollection from './type/static';

export function createCollection(name, collectionConfig, getConfig) {
  if (collectionConfig.static) {
    return new StaticCollection(name, collectionConfig, getConfig);
  } else if (collectionConfig.metadata) {
    return new MetadataCollection(name, collectionConfig, getConfig);
  } else {
    return new FileSystemCollection(name, collectionConfig, getConfig);
  }
}
