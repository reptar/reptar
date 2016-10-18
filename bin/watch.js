import activity from 'activity-logger';
import _ from 'lodash';
import path from 'path';
import Hapi from 'hapi';
import inert from 'inert';
import ora from 'ora';
import chokidar from 'chokidar';
import { YAML } from '../lib/constants';
import log from '../lib/log';
import Reptar from '../lib';

class Server {
  constructor(reptar) {
    this.reptar = reptar;

    /**
     * Index used to find associated File/CollectionPage with a request.path.
     * @type {Object.<string,(File|CollectionPage)>}
     */
    this.index = {};

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
      handler: this.routeHandler,
    });

    this.updateIndex();

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
   * Update's our index.
   */
  updateIndex() {
    const createIndexKey = (file) => {
      return this.relativeDestination(file.destination);
    };

    this.index = _.extend(
      _.keyBy(this.reptar.files, createIndexKey),
      ..._.map(this.reptar.collections, collection =>
        _.keyBy(collection.pages, createIndexKey)
      )
    );
  }

  /**
   * Get File/CollectionPage based on request.path.
   * @param {string} requestPath Request path to server.
   * @return {File|CollectionPage}
   */
  getFile(requestPath) {
    let file = this.index[requestPath];
    if (!file) {
      file = this.index[path.join(requestPath, 'index.html')];
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
      this.updateIndex();

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
    await file.update(this.reptar.data);

    // Depending on what Files were updated we should update our Collections.
    this.reptar.readCollections();

    // Render the File/CollectionPage.
    const content = await file.renderWithPlugins(this.reptar.data);

    // If we want debug information then render the JSON version.
    if (isDebug) {
      return reply(JSON.stringify(file)).type('application/json');
    }

    if (file.path != null) {
      log.info(`Rendering File ${file.id}`);
    } else {
      log.info(`Rendering CollectionPage ${file.id}`);
    }

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
    const asset = _.find(this.reptar.theme.assets, asset => {
      const destination = this.relativeDestination(
        asset.processor && asset.destination ?
          asset.destination :
          asset.config.destination
      );

      return requestPath.includes(destination);
    });

    if (asset == null) {
      return;
    }

    if (asset.processor != null && asset.content) {
      const contentType = request.server.mime.path(request.path).type;
      return reply(asset.content).type(contentType);
    }

    const relativeRequestPath = requestPath.replace(
      this.relativeDestination(asset.config.destination),
      ''
    );

    return reply.file(
      path.join(asset.config.source, relativeRequestPath)
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
        fn(...args).then(() => fn.running = false);
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

      await this.reptar.theme.read();
      this.updateIndex();

      spinner.text = `${label} (${Date.now() - startTime}ms)`;
      spinner.succeed();
    }));

    chokidar.watch([
      path.join(this.reptar.config.root, YAML.CONFIG)
    ]).on('change', debounceFunction(async (changePath) => {
      log.info(`_config.yml updated at ${changePath}`);

      await this.reptar.update();
      this.updateIndex();
    }));

    chokidar.watch([
      this.reptar.config.get('path.data'),
    ]).on('change', debounceFunction(async (changePath) => {
      log.info(`Data updated at ${changePath}`);

      await this.reptar.update();
      this.updateIndex();
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

  log.info('Server running at:', server.server.info.uri);
}
