import Promise from 'bluebird';
import _ from 'lodash';
import moment from 'moment';
import path from 'path';
import rimraf from 'rimraf';
import glob from 'glob';
import ora from 'ora';
import log from './log';
import cache from './cache';
import * as CONSTANTS from './constants';
import { createChecksum } from './checksum';
import Config from './config';
import Url from './url';
import DataFiles from './data-files';
import {
  configureTemplateEngine,
} from './template';
import {
  configureMarkdownEngine,
} from './markdown';
import Plugin from './plugin/index';
import Theme from './theme';
import {
  createCollection,
} from './collection';
import File from './file';

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
    log.error(e);
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
     * Expose config object on instance.
     * @type {Config}
     */
    this.config = new Config(options.rootPath);

    /**
     * Returns our config instance.
     * @return {Object}
     */
    this.getConfig = () => {
      return this.config;
    };

    /**
     * Save options passed into instance.
     * @type {Object}
     */
    this.options = _.defaults(options, {
      noTemplateCache: false,
      clean: false,
    });

    /**
     * All files found in our source path.
     * Key is the full path to the file, value is the actual File object.
     * @type {Object.<string, File>}
     */
    this.files = Object.create(null);

    /**
     * Site wide data available in all templates.
     * @type {Object.<string, Object>}
     */
    this.data = Object.create(null);

    /**
     * Mapping of Collection IDs to the instance.
     * @type {Object.<string, Collection>}
     */
    this.collections = Object.create(null);

    /**
     * Class responsible for handling themes.
     * @type {Theme}
     */
    this.theme = new Theme();
    this.theme.setGetConfig(this.getConfig);

    /**
     * Expose collections.
     * @type {Object}
     */
    this.data.collections = Object.create(null);
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

    // Configure markdown engine.
    configureMarkdownEngine(this.config.get('markdown.options'));

    /**
     * Expose site data from config file.
     * @type {Object}
     */
    this.data.site = this.config.get('site');

    // Load data files.
    const dataFiles = await DataFiles.update(this.config.get('path.data'));

    // Expose it on the site object.
    this.data.site.data = dataFiles;

    // Update our collection configs.
    _.map(
      this.config.get('collections'),
      (collectionConfig, collectionName) => {
        const instance = createCollection(
          collectionName,
          collectionConfig,
          this.getConfig
        );

        this.collections[instance.id] = instance;
      }
    );

    // Read theme files, processing any files that it needs to so that we get
    // the final path to the ready to write files.
    await wrapCommand(
      'Reading theme files.\t\t',
      async () => {
        await this.theme.read();
        // Expose theme data globally.
        this.data.theme = this.theme.data;
      }
    );

    await wrapCommand(
      'Loading plugins.\t\t',
      () => {
        // Built-in plugins.
        Plugin.loadFromPackageJson(
          Url.pathFromRoot('./'),
          this.config.get('plugins')
        );
        [
          this.theme.config.path.plugins, // Active theme plug-ins
          this.config.get('path.plugins') // Site plug-ins
        ].forEach(path => Plugin.loadFromDirectory(path));
      }
    );

    await wrapCommand(
      'Reading files.\t\t',
      this.readFiles.bind(this)
    );

    await wrapCommand(
      'Reading collections.\t\t',
      this.readCollections.bind(this)
    );
  }

  async readFiles() {
    const configPathSource = this.config.get('path.source');

    // Create an array of patterns that we should ignore when reading the source
    // files of the Reptar site from disk.
    // This primarily includes the '_config.yml' file as well as every path
    // directory that isn't our source path, primarily '_site', '_plugins',
    // and '_themes'.
    const ignorePatterns = _.values(CONSTANTS.YAML).concat(
      _.values(this.config.get('path')).filter(path =>
        path !== configPathSource
      )
    );

    // Ignore package.json file as well.
    ignorePatterns.push('package.json');

    // Read all files from disk and get their file paths.
    const files = await Promise.fromCallback(cb => {
      glob(configPathSource + '/**/*', {
        // Do not match directories, only files.
        nodir: true,
        // Array of glob patterns to exclude from matching.
        ignore: ignorePatterns.map(path => `**/${path}/**`).concat(
          `${configPathSource}/node_modules/**`
        ),
        // Follow symlinks.
        follow: true
      }, cb);
    });

    const filePromises = files.map(filePath => {
      // Correct the filePath created by glob to be compatible with Windows.
      // Known issue in node-glob https://github.com/isaacs/node-glob/pull/263.
      filePath = path.normalize(filePath.replace(/\//g, path.sep));

      const sourceFile = new File(filePath, this.getConfig);
      this.files[sourceFile.id] = sourceFile;

      return sourceFile.update();
    });

    return Promise.all(filePromises);
  }

  readCollections() {
    // Populate every collection with its files.
    _.each(this.collections, collection => {
      collection.populate(this.files, this.collections);

      // Add collection data to our global data object.
      this.data.collections[collection.name] = collection.data;
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
        await Promise.fromCallback(cb => {
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

    this.data.reptar = Reptar.getReptarData();

    // Writes Theme files and assets to file system.
    await wrapCommand(
      'Writing theme files.\t\t',
      this.theme.write.bind(this.theme)
    );

    await wrapCommand(
      'Writing files.\t\t',
      () => {
        return Promise.all(_.reduce(this.files, (result, file) => {
          return result.concat(file.write(this.data));
        }, []));
      }
    );

    await wrapCommand(
      'Writing collection pages.\t',
      () => {
        return Promise.all(_.map(this.collections, collection => {
          return collection.write(this.data);
        }));
      }
    );
  }

  /**
   * Get information about the Reptar installation from its package.json.
   * @return {Object}
   */
  static getReptarData() {
    let packageJson = {};
    try {
      packageJson = require(Url.pathFromRoot('./package.json'));
    } catch (e) { /* swallow */ }

    return {
      version: packageJson.version,
      time: moment((new Date()).getTime()).format()
    };
  }
}
