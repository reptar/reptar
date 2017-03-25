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
import addCollections from './collection';
import addDataFiles from './data-files';

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

/**
 * Process middleware functions.
 * @param {Array.<function>} options.middlewares Middleware functions.
 * @param {Reptar} options.reptar Reptar instance.
 * @return {Promise} Returns a Promise.
 */
function processMiddlewares({ middlewares, reptar }) {
  return new Promise((resolve, reject) => {
    ware(middlewares).run(reptar, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
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
      showSpinner: true,
    });

    this._wrapCommand = this.options.showSpinner ?
      wrapCommand :
      (label, fn) => fn();

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
     * Our destination object of where our files will be written.
     * @type {Object.<string, File>}
     */
    this.destination = Object.create(null);
  }

  async _processMiddlewares({ middlewaresKey }) {
    const middlewares = this.config.get(middlewaresKey);

    if (middlewares.length === 0) {
      return;
    }

    const tabs = middlewaresKey.length > 11 ? '\t\t' : '\t\t';

    await this._wrapCommand(
      `Running "${middlewaresKey}".${tabs}`,
      () => processMiddlewares({ middlewares, reptar: this })
    );
  }

  async update({ skipFiles = false } = {}) {
    this.config.update();

    await this._processMiddlewares({
      middlewaresKey: 'lifecycle.willUpdate',
    });

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

    this.renderer.update({
      noTemplateCache: this.options.noTemplateCache,
    });

    // Expose site data from config file.
    this.metadata.set('site', this.config.get('site'));

    if (!skipFiles) {
      await this._wrapCommand(
        'Reading files.\t\t\t',
        this.fileSystem.loadIntoMemory.bind(this.fileSystem)
      );
    }

    _.forEach(this.fileSystem.files, (file) => {
      this.destination[file.destination] = file;
    });

    this.metadata.set('reptar', Reptar.getReptarData());

    addCollections(this);
    addDataFiles(this);

    await this._processMiddlewares({
      middlewaresKey: 'lifecycle.didUpdate',
    });

    await this._processMiddlewares({
      middlewaresKey: 'middlewares',
    });
  }

  /**
   * Removes configured destination directory and all files contained.
   * @return {Promise} Promise object.
   */
  cleanDestination() {
    return this._wrapCommand(
      'Cleaning destination.\t\t\t',
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
    await this._processMiddlewares({
      middlewaresKey: 'lifecycle.willBuild',
    });

    if (this.config.get('cleanDestination') || this.options.clean) {
      await this.cleanDestination();
    }

    const metadata = this.metadata.get();

    await this._wrapCommand(
      'Writing destination.\t\t\t',
      () =>
        Promise.all(
          _.map(this.destination, file => file.write(metadata))
        )
    );

    await this._processMiddlewares({
      middlewaresKey: 'lifecycle.didBuild',
    });
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
    } catch (e) { /* ignore */ }

    return {
      version: packageJson.version,
      time: moment((new Date()).getTime()).format(),
    };
  }
}
