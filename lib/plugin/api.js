const Plugin = require('./index');

const PluginAPI = {
  template: {
    addFilter: require('../utils/template').addFilter
  },

  // Dynamically created below.
  event: {}
};

// Dynamically create publicly accessible event functions.
for (let eventCategory in Plugin.Event) {
  PluginAPI.event[eventCategory] = {};

  for (let eventName in Plugin.Event[eventCategory]) {
    let eventKey = Plugin.Event[eventCategory][eventName];

    PluginAPI.event[eventCategory][eventName] = function(callback) {
      Plugin.addEventHandler(eventKey, callback);
    };
  }
}

module.exports = PluginAPI;
