/**
 * These are the Events supported by plugins.
 * @type {Object}
 */
const PluginEvents = {
  file: {
    beforeRender: 'file:beforeRender',
    afterRender: 'file:afterRender',
  },

  page: {
    beforeRender: 'page:beforeRender',
    afterRender: 'page:afterRender',
  },
};

export default PluginEvents;
