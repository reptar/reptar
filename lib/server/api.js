import path from 'path';
import _ from 'lodash';
import fp from 'lodash/fp';
import prunePrivateProperties from './prune-private-properties';

export function ApiService(reptar) {
  return {
    config: {
      get: (request, reply) => reply(reptar.config.get()),
    },
    files: {
      get(request, reply) {
        const files = reptar.fileSystem.files;
        const { query } = request;

        function sanitizeFile(file) {
          if (!file) {
            return [];
          }
          return [prunePrivateProperties(file)];
        }

        if (query.path) {
          const pathSource = reptar.config.get('path.source');
          const value = query.path;
          const file = files[value] || files[path.join(pathSource, value)];
          return reply(sanitizeFile(file));
        }

        if (query.destination) {
          const value = query.destination;
          const file = reptar.destination[value] ||
            reptar.destination[`/${value}`];
          return reply(sanitizeFile(file));
        }

        const response = _.flow([
          fp.filter(
            [
              'filtered',
              'skipProcessing',
            ].reduce((acc, key) => {
              if (query[key]) {
                acc[key] = query[key] !== 'false';
              }

              return acc;
            }, {})
          ),
          fp.filter((file) => {
            if (!query.assetProcessor) {
              return true;
            }
            if (query.assetProcessor !== 'false') {
              return file.assetProcessor != null;
            }
            return file.assetProcessor == null;
          }),
          fp.map((file) => {
            const result = prunePrivateProperties(file);
            if (query.excludeContent) {
              result.data.content = '[...omitted..]';
            }
            return result;
          }),
        ])(files);

        return reply(response);
      },
    },
    collections: {
      get(request, reply) {
        const { params, query } = request;

        if (!params.id) {
          return reply(Object.keys(reptar.collections));
        }

        const collection = reptar.collections[params.id];

        if (!collection) {
          return reply({});
        }

        const response = prunePrivateProperties(collection);

        const includes = query.include ? query.include.split(',') : [];

        const sanitize = f => prunePrivateProperties(f);
        response.pages = response.pages.map(sanitize);
        response.data.pages = response.data.pages.map(sanitize);
        response.files = _.mapValues(response.files, sanitize);
        response.data.files = _.mapValues(response.data.files, sanitize);

        const defaultExcludes = [
          'pages',
          'files',
          'data',
        ];

        _.difference(defaultExcludes, includes).forEach((prop) => {
          delete response[prop];
        });

        return reply(response);
      },
    },
  };
}

const ApiPlugin = {
  register: (server, { reptar }, next) => {
    const apiService = ApiService(reptar);

    server.route({
      method: 'GET',
      path: '/api/config',
      config: {
        cors: true,
      },
      handler: apiService.config.get,
    });

    server.route({
      method: 'GET',
      path: '/api/files',
      config: {
        cors: true,
      },
      handler: apiService.files.get,
    });

    server.route({
      method: 'GET',
      path: '/api/collections/{id?}',
      config: {
        cors: true,
      },
      handler: apiService.collections.get,
    });

    next();
  },
};

ApiPlugin.register.attributes = {
  name: 'api',
};

export default ApiPlugin;
