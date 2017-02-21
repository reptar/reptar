import Promise from 'bluebird';
import _ from 'lodash';
import fp from 'lodash/fp';
import moment from 'moment';
import path from 'path';
import rimraf from 'rimraf';
import ora from 'ora';
import cache from './cache';
import createChecksum from './checksum';
import Config from './config';
import FileSystem from './file-system';
import log from './log';
import Url from './url';
import DataFiles from './data-files';
import {
  configureTemplateEngine,
} from './template';
import Metadata from './metadata';
import PluginManager from './plugin';
import Renderer from './renderer';
import Theme from './theme';
import {
  createCollection,
} from './collection';

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
     * @type {PluginManager}
     */
    this.pluginManager = new PluginManager({
      config: this.config,
    });

    /**
     * @type {Renderer}
     */
    this.renderer = new Renderer({
      config: this.config,
      pluginManager: this.pluginManager,
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

    /**
     * Mapping of Collection IDs to the instance.
     * @type {Object.<string, Collection>}
     */
    this.collections = Object.create(null);

    // Expose collections.
    this.metadata.set('collections', Object.create(null));
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

    // Configure template engine.
    configureTemplateEngine({
      config: this.config,
      paths: this.theme.config.path.templates,
      noCache: this.options.noTemplateCache,
    });

    this.renderer.update();

    // Expose site data from config file.
    this.metadata.set('site', this.config.get('site'));

    // Load data files.
    const dataFiles = await DataFiles.update(this.config.get('path.data'));

    // Expose it on the site object.
    this.metadata.set('site.data', dataFiles);

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
      'Loading plugins.\t\t',
      this.pluginManager.update.bind(this.pluginManager, {
        theme: this.theme,
        getMarkdownEngine: this.renderer.getMarkdownEngine.bind(this.renderer),
      })
    );

    await wrapCommand(
      'Reading files.\t\t',
      this.fileSystem.loadIntoMemory.bind(this.fileSystem)
    );

    // Update our collection configs.
    _.map(
      this.config.get('collections'),
      (collectionConfig, collectionName) => {
        const instance = createCollection(
          collectionName,
          collectionConfig,
          this.config,
          this.renderer
        );

        this.collections[instance.id] = instance;
      }
    );

    await wrapCommand(
      'Reading collections.\t\t',
      this.readCollections.bind(this)
    );
  }

  readCollections() {
    // Populate every collection with its files.
    _.each(this.collections, (collection) => {
      collection.populate(this.fileSystem.files, this.collections);

      // Add collection data to our global data object.
      this.metadata.set(`collections.${collection.name}`, collection.data);
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

    // Collect all Files and CollectionPages
    const allFiles = _.concat(
      _.values(this.fileSystem.files),
      _.flatMap(this.collections, 'pages')
    );

    // See if any two objects have the same destination path.
    const destinationCollisions = _.flow(
      fp.groupBy('destination'),
      fp.pickBy(val => val.length > 1)
    )(allFiles);

    // Show a warning for any collisions detected.
    _.forEach(destinationCollisions, (files, dest) => {
      log.warn(
        `Destination collision detected at ${dest}\n` +
        `\t Source files:\n\t\t${files.map(f => f.id).join('\n\t\t')}`
      );
    });

    this.metadata.set('reptar', Reptar.getReptarData());

    // Writes Theme files and assets to file system.
    await wrapCommand(
      'Writing theme files.\t\t',
      this.theme.write.bind(this.theme)
    );

    await wrapCommand(
      'Writing files.\t\t',
      this.fileSystem.writeToDisk.bind(this.fileSystem, this.metadata.get())
    );

    await wrapCommand(
      'Writing collection pages.\t',
      () =>
        Promise.all(
          _.map(this.collections, collection =>
            collection.write(this.metadata.get())
          )
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
