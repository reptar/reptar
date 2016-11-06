import _ from 'lodash';
import { addTemplateFilter } from '../template';
import Events from './events';

/**
 * Create the public plugin API.
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
