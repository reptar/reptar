import _ from 'lodash';
import FileSystemCollection from './type/file-system';
import MetadataCollection from './type/metadata';

export function createCollection(name, collectionConfig, config, renderer) {
  if (collectionConfig.metadata) {
    return new MetadataCollection(name, collectionConfig, config, renderer);
  }

  return new FileSystemCollection(name, collectionConfig, config, renderer);
}

export default function addCollections(reptar) {
  const { destination } = reptar;

  /**
   * Mapping of Collection IDs to the instance.
   * @type {Object.<string, Collection>}
   */
  const collections = Object.create(null);

  // Expose collections.
  reptar.metadata.set('collections', Object.create(null));

  // Update our collection configs.
  _.forEach(
    reptar.config.get('collections'),
    (collectionConfig, collectionName) => {
      const instance = createCollection(
        collectionName,
        collectionConfig,
        reptar.config,
        reptar.renderer
      );

      collections[instance.id] = instance;
    }
  );

  // Populate every collection with its files.
  _.each(collections, (collection) => {
    collection.populate(reptar.fileSystem.files, collections);

    // Add collection data to our global data object.
    reptar.metadata.set(`collections.${collection.name}`, collection.data);

    _.forEach(collection.pages, (page) => {
      destination[page.destination] = page;
    });
  });

  // Expose collections.
  reptar.collections = collections;
}
