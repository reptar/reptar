const Promise = require('bluebird');
const Events = require('./events');

const Plugin = {
  _handlers: {},

  _reset() {
    Plugin._handlers = {};
  },

  _getHandlers(eventName) {
    Plugin._handlers[eventName] = Plugin._handlers[eventName] || [];
    return Plugin._handlers[eventName];
  },

  addEventHandler(eventName, handler) {
    Plugin._getHandlers(eventName).push(handler);
  },

  processEventHandlers(eventName, ...args) {
    let handlers = Plugin._getHandlers(eventName);

    let promise = Promise.resolve(...args);
    handlers.forEach(handler => {
      promise = promise.then(handler);
    });

    return promise;
  },

  Events: Events
};


module.exports = Plugin;
