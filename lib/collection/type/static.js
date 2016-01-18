import Promise from 'bluebird';
import fs from 'fs-extra';
Promise.promisifyAll(fs);
import path from 'path';
import logger from 'winston';
import isUndefined from 'lodash/isUndefined';

import config from '../../config';
import CollectionBase from '../base';

export default class StaticCollection extends CollectionBase {
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
      logger.warn(`Could not copy StaticCollection '${this.path}'.`);
    }

    return promise;
  }
}
