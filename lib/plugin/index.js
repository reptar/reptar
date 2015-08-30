const path = require('path');
const glob = require('glob');
const isUndefined = require('lodash/lang/isUndefined');
const each = require('lodash/collection/each');
const merge = require('lodash/object/merge');
const logger = require('winston');
const config = require('../config');
const Event = require('./event');
const API = require('./api');

const gulpPluginRegex = /^yarn\-/;

class Plugin {
  constructor() {
    this._handlers = {};

    this._constructAPIEventHandlers(API);
  }

  _constructAPIEventHandlers(API) {
    let addEventHandler = this.addEventHandler.bind(this);

    // Dynamically create publicly accessible event functions.
    for (let eventCategory in Event) {
      API.event[eventCategory] = {};

      for (let eventName in Event[eventCategory]) {
        let eventKey = Event[eventCategory][eventName];

        API.event[eventCategory][eventName] = function(callback) {
          addEventHandler(eventKey, callback);
        };
      }
    }

    // Expose utility merge function.
    API.merge = merge;
  }

  _reset() {
    this._handlers = {};
  }

  _getHandlers(eventName) {
    this._handlers[eventName] = this._handlers[eventName] || [];
    return this._handlers[eventName];
  }

  addEventHandler(eventName, handler) {
    this._getHandlers(eventName).push(handler);
  }

  /**
   * Processes our queue of event handlers for a given eventName.
   * If a handler returns 'undefined' then we give the next handler the original
   * arguments so that every handler gets to touch the data.
   * @param {string} eventName Event key where the handlers live.
   * @param {*} args Arguments.
   * @return {Promise} Promise that resolves to the ending value of the promise
   *   chain.
   */
  async processEventHandlers(eventName, ...args) {
    let handlers = this._getHandlers(eventName);

    // If we have only one value then unpack it.
    let value = args.length === 1 ? args[0] : args;
    for (let i = 0; i < handlers.length; i++) {
      let handler = handlers[i];
      let newVal;

      newVal = await handler.apply(undefined, [].concat(value));

      // Only save the new value if it is undefined. This is to prevent bad
      // plugin offenders from breaking the promise return chain.
      if (!isUndefined(newVal)) {
        value = newVal;
      }
    }

    return value;
  }

  _loadPlugin(pluginPath = '', options = {}) {
    require(pluginPath)(API, options);
  }

  loadFromPackageJson(directory = '') {
    const packageJson = 'package.json';
    const packageKeys = [
      'dependencies',
      'devDependencies',
      'peerDependencies'
    ];

    const packagePath = path.join(directory, packageJson);
    let json;
    try {
      json = require(packagePath);
    } catch (e) {
      logger.info(`No ${packageJson} found at ${packagePath}`);
    }

    if (!json) {
      return;
    }

    let plugins = new Set();

    packageKeys.forEach(packageKey => {
      each(json[packageKey], (version, name) => {
        // Only load a plugin once.
        if (name.match(gulpPluginRegex) && !plugins.has(name)) {
          plugins.add(name);

          let configName = name.replace(gulpPluginRegex, '');
          let pluginConfig = config.plugins[configName];

          if (pluginConfig && pluginConfig.enabled) {
            this._loadPlugin(name, pluginConfig.options);
          }
        }
      });
    });
  }

  /**
   * Load all .js files from a directory and load them as a plugin.
   * @param {string} directory Path to directory where plugin files exist.
   */
  loadFromDirectory(directory = '') {
    let files = glob.sync(directory + '/**/*.js', {
      nodir: true
    });

    if (!files.length) {
      return;
    }

    files.forEach(filePath => this._loadPlugin(filePath));
  }
}

const instance = new Plugin();

instance.Event = Event;
instance.API = API;

module.exports = instance;
