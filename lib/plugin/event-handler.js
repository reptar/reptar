import _ from 'lodash';

export default class EventHandler {
  _handlers = {};

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
    const handlers = this._getHandlers(eventName);

    let processedValue = args;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < handlers.length; i++) {
      const handler = handlers[i];
      let newVal;

      // We need the returned value so we can give it to the next event handler.
      // Effectively a waterfall.
      // eslint-disable-next-line no-await-in-loop
      newVal = await handler(...processedValue);

      // We allow a plugin to return undefined or null to implicitly
      // allow us to use the original value that was passed into the
      // plugin handler.
      if (_.isUndefined(newVal) || newVal === null) {
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
          ' return all arguments given to it.');
      } else {
        // eslint-disable-next-line no-loop-func
        const allTypesMatch = newVal.every((val, index) =>
           typeof val === typeof processedValue[index]
        );

        if (!allTypesMatch) {
          throw new Error(`Plugin handler for '${eventName}' did not` +
            ' return all arguments in given order.');
        }
      }

      processedValue = newVal;
    }

    // If we have only one value then unpack it.
    return processedValue.length === 1 ?
      processedValue[0] :
      processedValue;
  }
}
