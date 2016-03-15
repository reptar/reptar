import fs from 'fs-extra';
import isUndefined from 'lodash/isUndefined';

import log from '../log';
import browserify from './processor/browserify';
import less from './processor/less';
import sass from './processor/sass';

let processors = {
  browserify,
  less,
  sass,
};

export default class Asset {
  constructor(assetType, assetConfig) {
    /**
     * ID of asset, right now an alias to its type.
     * @type {string}
     */
    this.id = assetType;

    /**
     * What type of asset this is. css/js/font etc.
     * @type {string}
     */
    this.type = assetType;

    /**
     * The asset config object.
     * @type {Object}
     */
    this.config = assetConfig;

    // If this asset has a processor, instantiate the class that handles how to
    // process the asset.
    if (this.config.processor && this.config.processor.name) {
      let processorName = this.config.processor.name;
      let ProcessorClass = processors[processorName];

      if (isUndefined(ProcessorClass)) {
        let msg = `Could not load processer '${processorName}'. Aborting.`;
        log.error(msg);
        throw new Error(msg);
      }

      /**
       * Asset processor.
       * @type {Processor}
       */
      this.processor = new ProcessorClass(this);

      /**
       * Processed file.
       * @type {Object}
       */
      this._processedFile;
    }

    /**
     * Data accessible to templates.
     * @type {Object}
     */
    this.data = Object.create(null);
  }

  async process(destination) {
    if (!this.processor) {
      return;
    }

    try {
      this._processedFile = await this.processor.process();
    } catch (e) {
      log.error('Could not process file.');
      throw e;
    }

    // Expose relative url to file.
    this.data.url = this._processedFile.destination.replace(destination, '');
  }

  async write() {
    // If there is a processor let it handle writing the file.
    if (this.processor) {
      if (!this._processedFile) {
        log.warn(`Asset: ${this.id} found no processed file when about ` +
          'to write asset to disk. Processing now.');
        await this.process();
      }

      fs.outputFileSync(
        this._processedFile.destination,
        this._processedFile.asset,
        'utf8'
      );
    } else {
      // If there's no processor then just copy the source to the destination.
      try {
        fs.copySync(this.config.source, this.config.destination);
      } catch (e) {
        log.error(`Asset: Could not copy '${this.type}' assets.`);
      }
    }
  }
}
