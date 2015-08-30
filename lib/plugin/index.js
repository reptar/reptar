const isUndefined = require('lodash/lang/isUndefined');
const Events = require('./events');

class Plugin {
  constructor() {
    this._handlers = {};
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

    let value;
    for (let i = 0; i < handlers.length; i++) {
      let handler = handlers[i];
      let newVal;

      if (isUndefined(value)) {
        newVal = await handler(...args);
      } else {
        newVal = await handler(value);
      }

      // Only save the new value if it is undefined. This is to prevent bad
      // plugin offenders from breaking the promise return chain.
      if (!isUndefined(newVal)) {
        value = newVal;
      }
    }

    return value;
  }
}

const instance = new Plugin();

instance.Events = Events;

module.exports = instance;
