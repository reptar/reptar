const Promise = require('bluebird');
const path = require('path');
const fs = Promise.promisifyAll(require('fs-extra'));
const logger = require('winston');
const isUndefined = require('lodash/lang/isUndefined');

const config = require('../../config');
const CollectionBase = require('../base');

class StaticCollection extends CollectionBase {
  constructor(name, collectionConfig) {
    super(name, collectionConfig);

    if (!isUndefined(collectionConfig.path)) {
      /**
       * If this is a static collection calculate its destination path.
       * @type {string}
       */
      this.staticDestination = path.resolve(
        config.path.destination,
        collectionConfig.path
      );
    }
  }

  populate() {
    return this;
  }

  /**
   * Writes both files and pages that are in this collection.
   * @return {Promise}
   */
  async write() {
    let promise;
    try {
      promise = await fs.copyAsync(this.path, this.staticDestination);
    } catch (e) {
      logger.error(`Could not copy StaticCollection '${this.path}'.`);
    }

    return promise;
  }
}

module.exports = StaticCollection;