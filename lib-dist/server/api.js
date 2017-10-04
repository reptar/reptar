'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _map2 = require('lodash/fp/map');

var _map3 = _interopRequireDefault(_map2);

var _filter2 = require('lodash/fp/filter');

var _filter3 = _interopRequireDefault(_filter2);

var _difference2 = require('lodash/difference');

var _difference3 = _interopRequireDefault(_difference2);

var _mapValues2 = require('lodash/mapValues');

var _mapValues3 = _interopRequireDefault(_mapValues2);

var _flow2 = require('lodash/flow');

var _flow3 = _interopRequireDefault(_flow2);

exports.ApiService = ApiService;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _prunePrivateProperties = require('./prune-private-properties');

var _prunePrivateProperties2 = _interopRequireDefault(_prunePrivateProperties);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ApiService(reptar) {
  return {
    config: {
      get: (request, reply) => reply(reptar.config.get())
    },
    files: {
      get(request, reply) {
        const files = reptar.fileSystem.files;
        const query = request.query;


        function sanitizeFile(file) {
          if (!file) {
            return [];
          }
          return [(0, _prunePrivateProperties2.default)(file)];
        }

        if (query.path) {
          const pathSource = reptar.config.get('path.source');
          const value = query.path;
          const file = files[value] || files[_path2.default.join(pathSource, value)];
          return reply(sanitizeFile(file));
        }

        if (query.destination) {
          const value = query.destination;
          const file = reptar.destination[value] || reptar.destination[`/${value}`];
          return reply(sanitizeFile(file));
        }

        const response = (0, _flow3.default)([(0, _filter3.default)(['filtered', 'skipProcessing'].reduce((acc, key) => {
          if (query[key]) {
            acc[key] = query[key] !== 'false';
          }

          return acc;
        }, {})), (0, _filter3.default)(file => {
          if (!query.assetProcessor) {
            return true;
          }
          if (query.assetProcessor !== 'false') {
            return file.assetProcessor != null;
          }
          return file.assetProcessor == null;
        }), (0, _map3.default)(file => {
          const result = (0, _prunePrivateProperties2.default)(file);
          if (query.excludeContent) {
            result.data.content = '[...omitted..]';
          }
          return result;
        })])(files);

        return reply(response);
      }
    },
    collections: {
      get(request, reply) {
        const params = request.params,
              query = request.query;


        if (!params.id) {
          return reply((0, _keys2.default)(reptar.collections));
        }

        const collection = reptar.collections[params.id];

        if (!collection) {
          return reply({});
        }

        const response = (0, _prunePrivateProperties2.default)(collection);

        const includes = query.include ? query.include.split(',') : [];

        const sanitize = f => (0, _prunePrivateProperties2.default)(f);
        response.pages = response.pages.map(sanitize);
        response.data.pages = response.data.pages.map(sanitize);
        response.files = (0, _mapValues3.default)(response.files, sanitize);
        response.data.files = (0, _mapValues3.default)(response.data.files, sanitize);

        const defaultExcludes = ['pages', 'files', 'data'];

        (0, _difference3.default)(defaultExcludes, includes).forEach(prop => {
          delete response[prop];
        });

        return reply(response);
      }
    }
  };
}

const ApiPlugin = {
  register: (server, _ref, next) => {
    let reptar = _ref.reptar;

    const apiService = ApiService(reptar);

    server.route({
      method: 'GET',
      path: '/api/config',
      config: {
        cors: true
      },
      handler: apiService.config.get
    });

    server.route({
      method: 'GET',
      path: '/api/files',
      config: {
        cors: true
      },
      handler: apiService.files.get
    });

    server.route({
      method: 'GET',
      path: '/api/collections/{id?}',
      config: {
        cors: true
      },
      handler: apiService.collections.get
    });

    next();
  }
};

ApiPlugin.register.attributes = {
  name: 'api'
};

exports.default = ApiPlugin;