const FileSystemCollection = require('./type/file-system');
const MetadataCollection = require('./type/metadata');
const StaticCollection = require('./type/static');

exports.create = function(name, collectionConfig) {
  if (collectionConfig.static) {
    return new StaticCollection(name, collectionConfig);
  } else if (collectionConfig.metadata) {
    return new MetadataCollection(name, collectionConfig);
  } else {
    return new FileSystemCollection(name, collectionConfig);
  }
};
