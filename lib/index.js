import winston from 'winston';
winston.cli({
  colorize: true
});

import path from 'path';
import Promise from 'bluebird';
import values from 'lodash/object/values';
import map from 'lodash/collection/map';
import rimraf from 'rimraf';
import logger from 'winston';
import glob from 'glob';
import * as CONSTANTS from './constants';
import config from './config';
import Render from './render';
import Plugin from './plugin/index';
import Theme from './theme';
import * as Collection from './collection';
import File from './file';

export default class Yarn {
  constructor() {
    /**
     * Site wide data available in all templates.
     * @type {Object.<string, Object>}
     */
    this.data = {};

    /**
     * All files found in our source path.
     * Key is the full path to the file, value is the actual File object.
     * @type {Object.<string, File>}
     */
    this.files = {};

    /**
     * Class responsible for handling themes.
     * @type {Theme}
     */
    this.theme = new Theme();

    // Subscribe to when config is updated.
    config.on(config.EVENTS.CONFIG_UPDATED, this.configUpdated.bind(this));

    // Kick off leading config update.
    this.configUpdated();
  }

  configUpdated() {
    this.theme.update();

    // Configure template engine.
    Render.configureTemplate([
      this.theme.config.path.templates
    ]);

    // Configure markdown engine.
    Render.configureMarkdown(config.remarkable);

    /**
     * Expose site data from config file.
     * @type {Object}
     */
    this.data.site = config.site;

    /**
     * Array of Collection instances.
     * @type {Array.<Collection>}
     */
    this.collections = map(config.collections,
      (collectionConfig, collectionName) => {
        return Collection.create(collectionName, collectionConfig);
      }
    );
  }

  async readFiles() {
    logger.info('Loading plugins...');
    // Built-in plugins.
    Plugin.loadFromPackageJson(path.resolve(__dirname, '../'));
    [
      this.theme.config.path.plugins, // Active theme plug-ins
      config.path.plugins // Site plug-ins
    ].forEach(path => Plugin.loadFromDirectory(path));
    logger.info('\tdone!');

    logger.info('Reading files...');
    let ignorePatterns = [
      'node_modules'
    ].concat(values(CONSTANTS.YAML)).concat(
      values(config.path).filter(path => path !== config.path.source)
    );

    this.collections.forEach(collection => {
      if (collection.static) {
        ignorePatterns.push(collection.path);
      }
    });

    let files = await Promise.fromNode(cb => {
      glob(config.path.source + '/**/*', {
        nodir: true,
        ignore: ignorePatterns.map(path => `**/${path}/**`)
      }, cb);
    });

    files.map(file => {
      let sourceFile = new File(file);
      this.files[sourceFile.id] = sourceFile;
    });

    /**
     * Expose collections.
     * @type {Object}
     */
    this.data.collections = {};

    // Populate every collection with its files.
    this.collections.forEach(collection => {
      collection.populate(this.files, this.collections);

      // Add collection data to our global data object.
      this.data.collections[collection.name] = collection.data;
    });

    logger.info('\tdone!');

    return Promise.resolve();
  }

  /**
   * Removes configured destination directory and all files contained.
   * @return {Promise} Promise object.
   */
  async cleanDestination() {
    let promise;

    logger.info('Cleaning destination %s', config.path.destination);
    try {
      promise = await Promise.fromNode(cb => {
        rimraf(config.path.destination, cb);
      });
    } catch (e) {
      logger.error(e);
    }

    logger.info('\tdone!');

    return promise;
  }

  /**
   * Builds the yarn site in its entirety.
   * @return {Promise} Promise of when we're done building.
   */
  async build() {
    let promise;

    if (config.clean_destination) {
      promise = await this.cleanDestination();
    }

    // Write theme static files.
    logger.info('Writing theme files...');
    try {
      promise = await this.theme.write();
    } catch (e) {
      logger.error(e);
    }
    logger.info('\tdone!');

    // Expose theme data globally.
    this.data.theme = this.theme.data;

    logger.info('Writing files...');
    try {
      promise = await Promise.all(this.collections.map(collection => {
        return collection.write(this.data);
      }));
    } catch (e) {
      logger.error(e);
    }
    logger.info('\tdone!');

    return promise;
  }
}
