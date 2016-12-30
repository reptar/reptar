import _ from 'lodash';
import { addTemplateFilter } from '../template';
import { getMarkdownEngine } from '../markdown';
import Events from './events';

/**
 * Create the public plugin API.
 * @param {Object} options Options.
 * @param {Function} options.addEventHandler Handler for events.
 * @return {Object} Public API.
 */
export default function createPluginApi({
  addEventHandler = _.noop,
} = {}) {
  return {
    // Expose utility merge function.
    merge: _.merge,

    template: {
      addFilter: addTemplateFilter,
    },

    markdown: {
      /**
       * Usage:
       * Plugin.markdown.configure(function(md) {
       *   // md is the markdown-it engine instance.
       *   // You can do whatever you want with it.
       *   md.use(mdExtension)
       * });
       * @param {Function} cb Given markdown engine instance.
       * @return {void}
       */
      configure: cb => cb(getMarkdownEngine()),
    },

    // Creates a public API which you can use to easily add event handlers.
    event: _.reduce(Events, (api, categoryEvents, eventCategory) => {
      api[eventCategory] = {};

      _.forEach(categoryEvents, (eventKey, eventName) => {
        api[eventCategory][eventName] = (callback) => {
          addEventHandler(eventKey, callback);
        };
      });

      return api;
    }, {}),
  };
}
