const Plugin = require('./index');

const PluginAPI = {
  template: {
    addFilter: require('../utils/template').addFilter
  },

  // Dynamically created below.
  event: {}
};

// Dynamically create publicly accessible event functions.
for (let eventCategory in Plugin.Events) {
  PluginAPI.event[eventCategory] = {};

  for (let eventName in Plugin.Events[eventCategory]) {
    let eventKey = Plugin.Events[eventCategory][eventName];

    PluginAPI.event[eventCategory][eventName] = function(callback) {
      Plugin.addEventHandler(eventKey, callback);
    };
  }
}

module.exports = PluginAPI;
