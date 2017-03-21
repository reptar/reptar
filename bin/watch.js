import activity from 'activity-logger';
import _ from 'lodash';
import path from 'path';
import Hapi from 'hapi';
import Boom from 'boom';
import inert from 'inert';
import ora from 'ora';
import chokidar from 'chokidar';
import Constants from '../lib/constants';
import log from '../lib/log';
import Reptar from '../lib';

// Given an obj it'll prune any properites that start with `_`.
function prunePrivateProperties(obj, isPrivate = (val, key) => key[0] === '_') {
  return _.reduce(obj, (acc, val, key) => {
    if (!isPrivate(val, key)) {
      acc[key] = val;
    }
    return acc;
  }, {});
}

class Server {
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

  relativeDestination(destination) {
    return destination.replace(
      this.reptar.config.get('path.destination'),
      ''
    );
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

    let file = this.getFile(request.path);

    // If there's no associated File/CollectionPage then we pass handling to our
    // themeHandler.
    if (!file) {
      const response = this.themeHandler(request, reply);

      // If we found an asset response then just return it.
      if (response != null) {
        return response;
      }

      // However if we did not find a File/CollectionPage or an asset response
      // then we're going to update our Reptar instance and attempt to find
      // a file again.
      await this.reptar.update();

      file = this.getFile(request.path);

      // If we still don't have a File/CollectionPage then return 404.
      if (!file) {
        return reply('404');
      }
    }

    // If this File does not require any processing then it's a static asset
    // and we can just render it.
    if (file.skipProcessing) {
      return reply.file(file.path);
    }

    // Update the File/CollectionPage from disk.
    await file.update(this.reptar.metadata.get());

    // Depending on what Files were updated we should update our Collections.
    await this.reptar.process();

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
   * Handler to use for theme assets.
   * @param {Object} request Hapi Request object.
   * @param {Object} reply Hapi Response object.
   * @return {Object?} Optional response object, null if we can't find any
   *   associated asset.
   */
  themeHandler(request, reply) {
    const requestPath = request.path;

    // Find an associated theme asset.
    const requestAsset = _.find(this.reptar.theme.assets, (asset) => {
      const destination = this.relativeDestination(
        asset.processor && asset.destination ?
          asset.destination :
          asset.config.destination
      );

      return requestPath.includes(destination);
    });

    if (requestAsset == null) {
      return null;
    }

    if (requestAsset.processor != null && requestAsset.content) {
      const contentType = request.server.mime.path(request.path).type;
      return reply(requestAsset.content).type(contentType);
    }

    const relativeRequestPath = requestPath.replace(
      this.relativeDestination(requestAsset.config.destination),
      ''
    );

    return reply.file(
      path.join(requestAsset.config.source, relativeRequestPath)
    );
  }

  /**
   * Create file system watchers to update Reptar state according to when a
   * user updates files.
   */
  createFsWatchers() {
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

    chokidar.watch([
      this.reptar.theme.config.path.source,
    ]).on('change', debounceFunction(async (changePath) => {
      log.info(`Theme updated at ${changePath}`);
      const label = 'Updating theme.\t\t';

      const startTime = Date.now();
      const spinner = ora({
        text: label,
        spinner: 'dot4',
      }).start();

      try {
        await this.reptar.theme.read();
      } catch (e) {
        spinner.text += ` ${e.message}`;
        spinner.fail();
        return;
      }

      spinner.text = `${label} (${Date.now() - startTime}ms)`;
      spinner.succeed();
    }));

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

export default async function watch(options = {}) {
  const startActivity = activity.start('Starting watch.\t\t\t');

  const reptar = new Reptar({
    // Turn off caching of templates.
    noTemplateCache: true,

    ...options,
  });

  await reptar.update();

  const server = new Server(reptar);
  await server.start();

  activity.end(startActivity);

  process.stdout.write('\n');
  log.info('Server running at:', server.server.info.uri);
}
