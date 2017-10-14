import _ from 'lodash';

/**
 * Handles all metadata about your site that will be accessible within every
 * render context.
 */
export default class Metadata {
  constructor() {
    /**
     * Site wide data available in all templates.
     * @type {Object.<string, Object>}
     */
    this.metadata = Object.create(null);
  }

  /**
   * Gets either the entire metadata object or a part of it.
   * @param {string} [objPath] Property path of value we want back.
   * @return {*}
   */
  get(objPath) {
    if (!objPath) {
      return this.metadata;
    }

    return _.get(this.metadata, objPath);
  }

  /**
   * Set a value on our metadata.
   * @param {string|Array} objPath Path where we're setting our value.
   * @param {*} value Value we're setting.
   */
  set(objPath, value) {
    _.set(this.metadata, objPath, value);
  }
}
