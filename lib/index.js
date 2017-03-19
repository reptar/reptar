import Promise from 'bluebird';
import _ from 'lodash';
import moment from 'moment';
import path from 'path';
import rimraf from 'rimraf';
import ora from 'ora';
import ware from 'ware';
import cache from './cache';
import createChecksum from './checksum';
import Config from './config';
import FileSystem from './file-system';
import Url from './url';
import Metadata from './metadata';
import Renderer from './renderer';
import Theme from './theme';
import collectionMiddleware from './collection';
import defaultMiddleware from './middleware';

/**
 * Helper function to wrap commands with a log.startActivity command so we can
 * see how long a command takes.
 * @param {string} label A label to use for this command.
 * @param {Function} cmd A function to run as the command.
 */
async function wrapCommand(label, cmd) {
  const startTime = Date.now();
  const spinner = ora({
    text: label,
    spinner: 'dot4',
  }).start();

  try {
    await cmd();
    spinner.text = `${label} (${Date.now() - startTime}ms)`;
    spinner.succeed();
  } catch (e) {
    spinner.fail();
    throw e;
  }
}

export default class Reptar {
  /**
   * Create a new Reptar instance.
   * @param {Object} options Options object.
   * @param {string} options.rootPath Where the root path of this Reptar
   *   instance points to.
   * @param {boolean} options.incremental If we should incremental build files.
   * @param {boolean} options.noTemplateCache Should templates be cached.
   *   Typically this is only off when developing or in watch mode.
   */
  constructor(options = {}) {
    /**
     * Save options passed into instance.
     * @type {Object}
     */
    this.options = _.defaults(options, {
      noTemplateCache: false,
      clean: false,
      incremental: undefined,
      rootPath: undefined,
    });

    /**
     * Expose config object on instance.
     * @type {Config}
     */
    this.config = new Config(this.options.rootPath);

    /**
     * @type {Renderer}
     */
    this.renderer = new Renderer({
      config: this.config,
    });

    /**
     * Create backing FileSystem instance.
     * @type {FileSystem}
     */
    this.fileSystem = new FileSystem({
      config: this.config,
      renderer: this.renderer,
    });

    /**
     * Create metadata that will be accessible within every template.
     * @type {Metadata}
     */
    this.metadata = new Metadata();

    /**
     * Class responsible for handling themes.
     * @type {Theme}
     */
    this.theme = new Theme({
      config: this.config,
    });

    this.destination = Object.create(null);

    /**
     * Middleware functions.
     * @type {Array.<Function>}
     */
    this.middleware = [];
  }

  async update() {
    this.config.update();

    const { base, dir } = path.parse(this.config.root);
    cache.setNamespace(`${base}-${createChecksum(dir).slice(0, 10)}`);

    // Options passed into constructor take precedence over the config value.
    // We default to loading cache, unless explicitly set to false.
    const shouldLoadCache = !_.isNil(this.options.incremental) ?
      this.options.incremental !== false :
      this.config.get('incremental') !== false;
    if (shouldLoadCache) {
      cache.load();
    }

    Url.setSlugOptions(this.config.get('slug'));

    this.theme.update();

    this.renderer.update({
      noTemplateCache: this.options.noTemplateCache,
      templatePaths: this.theme.config.path.templates,
    });

    // Expose site data from config file.
    this.metadata.set('site', this.config.get('site'));

    // Read theme files, processing any files that it needs to so that we get
    // the final path to the ready to write files.
    await wrapCommand(
      'Reading theme files.\t\t',
      async () => {
        await this.theme.read();
        // Expose theme data globally.
        this.metadata.set('theme', this.theme.data);
      }
    );

    await wrapCommand(
      'Reading files.\t\t',
      this.fileSystem.loadIntoMemory.bind(this.fileSystem)
    );

    _.forEach(this.fileSystem.files, (file) => {
      this.destination[file.destination] = file;
    });

    this.metadata.set('reptar', Reptar.getReptarData());

    // Reset middleware collection.
    this.middleware = [];
    this.use(collectionMiddleware);
    defaultMiddleware.forEach(this.use, this);

    await this.process();
  }

  use(middlewareFunc) {
    this.middleware.push(middlewareFunc);
  }

  /**
   * Process middleware functions.
   * @return {Promise} Returns a Promise.
   */
  process() {
    return new Promise((resolve, reject) => {
      ware(this.middleware).run(this, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Removes configured destination directory and all files contained.
   * @return {Promise} Promise object.
   */
  cleanDestination() {
    return wrapCommand(
      'Cleaning destination.\t\t',
      async () => {
        await Promise.fromCallback((cb) => {
          rimraf(this.config.get('path.destination'), cb);
        });

        // Clear cache.
        cache.clear();
      }
    );
  }

  /**
   * Builds the Reptar site in its entirety.
   */
  async build() {
    if (this.config.get('clean_destination') || this.options.clean) {
      await this.cleanDestination();
    }

    // Writes Theme files and assets to file system.
    await wrapCommand(
      'Writing theme files.\t\t',
      this.theme.write.bind(this.theme)
    );

    const metadata = this.metadata.get();

    await wrapCommand(
      'Writing destination.\t\t',
      () =>
        Promise.all(
          _.map(this.destination, file => file.write(metadata))
        )
    );
  }

  /**
   * Get information about the Reptar installation from its package.json.
   * @return {Object}
   */
  static getReptarData() {
    let packageJson = {};
    try {
      // eslint-disable-next-line
      packageJson = require(Url.pathFromRoot('./package.json'));
    } catch (e) { /* swallow */ }

    return {
      version: packageJson.version,
      time: moment((new Date()).getTime()).format(),
    };
  }
}
