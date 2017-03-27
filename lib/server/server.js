import _ from 'lodash';
import path from 'path';
import Hapi from 'hapi';
import Boom from 'boom';
import inert from 'inert';
import chokidar from 'chokidar';
import Constants from '../constants';
import log from '../log';

// Given an obj it'll prune any properites that start with `_`.
function prunePrivateProperties(obj, isPrivate = (val, key) => key[0] === '_') {
  return _.reduce(obj, (acc, val, key) => {
    if (!isPrivate(val, key)) {
      acc[key] = val;
    }
    return acc;
  }, {});
}

function debounceFunction(fn) {
  return (...args) => {
    if (fn.running) {
      return;
    }
    fn.running = true;
    fn(...args).then(() => {
      fn.running = false;
    });
  };
}

export default class Server {
  constructor(reptar) {
    this.reptar = reptar;

    this.server = new Hapi.Server();

    this.server.connection({
      host: reptar.config.get('server.host'),
      port: reptar.config.get('server.port'),
    });
  }

  /**
   * Starts the Hapi server.
   * @return {Promise}
   */
  async start() {
    await this.server.register([
      inert,
    ]);

    this.server.route({
      method: 'GET',
      path: '/{p*}',
      handler: (request, reply) => {
        this.routeHandler(request, reply).catch((e) => {
          reply(Boom.badData(e.message));
        });
      },
    });

    this.createFsWatchers();

    // Start the server
    return this.server.start();
  }

  /**
   * Get File/CollectionPage based on request.path.
   * @param {string} requestPath Request path to server.
   * @return {File|CollectionPage}
   */
  getFile(requestPath) {
    let file = this.reptar.destination[requestPath];
    if (!file) {
      file = this.reptar.destination[path.join(requestPath, 'index.html')];
    }
    return file;
  }

  /**
   * Our default route handler for every request.
   * @param {Object} request Hapi Request object.
   * @param {Object} reply Hapi Response object.
   * @return {Promise}
   */
  routeHandler = async (request, reply) => {
    const isDebug = request.query.debug != null;

    const file = this.getFile(request.path);

    if (file.assetProcessor) {
      const content = await file.render();
      const contentType = request.server.mime.path(request.path).type;
      return reply(content).type(contentType);
    }

    // If this File does not require any processing then it's a static asset
    // and we can just render it.
    if (file.skipProcessing) {
      return reply.file(file.path);
    }

    // Update the File/CollectionPage from disk.
    await file.update(this.reptar.metadata.get());

    // We need to make sure we run all middleware and lifecycle hooks on
    // every render to ensure you get an accurate representation of your site.
    await this.reptar.update({ skipFiles: true });

    // Render the File/CollectionPage.
    const content = await file.render(this.reptar.metadata.get());

    // If we want debug information then render the JSON version.
    if (isDebug) {
      // Exclude private fields from being returned.
      const debugFile = prunePrivateProperties(file);
      return reply(JSON.stringify(debugFile)).type('application/json');
    }

    log.info(`Rendering ${file.id}`);

    return reply(content);
  }

  /**
   * Create file system watchers to update Reptar state according to when a
   * user updates files.
   */
  createFsWatchers() {
    chokidar.watch([
      path.join(this.reptar.config.root, Constants.ConfigFilename),
    ]).on('change', debounceFunction(async (changePath) => {
      log.info(`${Constants.ConfigFilename} updated at ${changePath}`);

      try {
        await this.reptar.update();
      } catch (e) {
        log.error(e);
      }
    }));

    chokidar.watch([
      this.reptar.config.get('path.data'),
    ]).on('change', debounceFunction(async (changePath) => {
      log.info(`Data updated at ${changePath}`);

      try {
        await this.reptar.update();
      } catch (e) {
        log.error(e);
      }
    }));
  }
}
