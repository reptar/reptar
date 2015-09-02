import FileSystemCollection from './type/file-system';
import MetadataCollection from './type/metadata';
import StaticCollection from './type/static';

export function create(name, collectionConfig) {
  if (collectionConfig.static) {
    return new StaticCollection(name, collectionConfig);
  } else if (collectionConfig.metadata) {
    return new MetadataCollection(name, collectionConfig);
  } else {
    return new FileSystemCollection(name, collectionConfig);
  }
}
