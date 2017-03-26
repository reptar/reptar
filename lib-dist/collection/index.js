'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _forEach2 = require('lodash/forEach');

var _forEach3 = _interopRequireDefault(_forEach2);

exports.createCollection = createCollection;
exports.default = addCollections;

var _fileSystem = require('./type/file-system');

var _fileSystem2 = _interopRequireDefault(_fileSystem);

var _metadata = require('./type/metadata');

var _metadata2 = _interopRequireDefault(_metadata);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createCollection(name, collectionConfig, config, renderer) {
  if (collectionConfig.metadata) {
    return new _metadata2.default(name, collectionConfig, config, renderer);
  }

  return new _fileSystem2.default(name, collectionConfig, config, renderer);
}

function addCollections(reptar) {
  const destination = reptar.destination;

  /**
   * Mapping of Collection IDs to the instance.
   * @type {Object.<string, Collection>}
   */

  const collections = (0, _create2.default)(null);

  // Expose collections.
  reptar.metadata.set('collections', (0, _create2.default)(null));

  // Update our collection configs.
  (0, _forEach3.default)(reptar.config.get('collections'), (collectionConfig, collectionName) => {
    const instance = createCollection(collectionName, collectionConfig, reptar.config, reptar.renderer);

    collections[instance.id] = instance;
  });

  // Populate every collection with its files.
  (0, _each3.default)(collections, collection => {
    collection.populate(reptar.fileSystem.files, collections);

    // Add collection data to our global data object.
    reptar.metadata.set(`collections.${collection.name}`, collection.data);

    (0, _forEach3.default)(collection.pages, page => {
      destination[page.destination] = page;
    });
  });
}