import glob from 'glob';
import isUndefined from 'lodash/isUndefined';
import merge from 'lodash/merge';
import config from '../config';

import {yarnPackageNameRegex, getYarnPackageNames} from '../json';
import Event from './event';
import API from './api';


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
   * If a handler returns 'undefined' then we give the next handler
   * the original arguments so that every handler gets to touch the
   * data.
   * @param {string} eventName Event key where the handlers live.
   * @param {*} args Arguments.
   * @return {Promise} Promise that resolves to the ending value of the
   *   promise chain.
   */
  async processEventHandlers(eventName, ...args) {
    let handlers = this._getHandlers(eventName);

    let processedValue = args;
    for (let i = 0; i < handlers.length; i++) {
      let handler = handlers[i];
      let newVal;

      newVal = await handler.apply(undefined, processedValue);

      // We allow a plugin to return undefined or null to implicitly
      // allow us to use the original value that was passed into the
      // plugin handler.
      if (isUndefined(newVal) || newVal === null) {
        newVal = processedValue;
      }

      // If our original value was an array of 1 and is now not an
      // array because a plugin just returned the value stick it back
      // into an array to keep its type consistent.
      if (processedValue.length === 1 && !Array.isArray(newVal)) {
        newVal = [newVal];
      }

      if (newVal.length !== processedValue.length) {
        throw new Error(`Plugin handler for '${eventName}' did not` +
          ` return all arguments given to it.`);
      } else {
        let allTypesMatch = newVal.every((val, index) => {
          return typeof val === typeof processedValue[index];
        });

        if (!allTypesMatch) {
          throw new Error(`Plugin handler for '${eventName}' did not` +
            ` return all arguments in given order.`);
        }
      }

      processedValue = newVal;
    }

    // If we have only one value then unpack it.
    return processedValue.length === 1 ?
      processedValue[0] : processedValue;
  }

  _loadPlugin(pluginPath = '', options = {}) {
    require(pluginPath)(API, options);
  }

  loadFromPackageJson(directory = '') {
    getYarnPackageNames(directory).forEach(name => {
      let configName = name.replace(yarnPackageNameRegex, '');
      let pluginConfig = config.plugins[configName];

      if (pluginConfig && pluginConfig.enabled) {
        this._loadPlugin(name, pluginConfig.options);
      }
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

export default instance;
