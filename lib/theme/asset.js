import fs from 'fs-extra';
import logger from 'winston';
import config from '../config';

export default class Asset {
  constructor(assetType, assetConfig) {
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
      let ProcessorClass;
      try {
        ProcessorClass = require(`./processor/${processorName}`);
      } catch (e) {
        logger.error(`Could not load processer '${processorName}'. Aborting.`);
        throw e;
      }

      /**
       * Asset processor.
       * @type {Processor}
       */
      this.processor = new ProcessorClass(this);
    }

    /**
     * Data accessible to templates.
     * @type {Object}
     */
    this.data;
  }

  async write() {
    // If there is a processor let it handle writing the file.
    if (this.processor) {
      let processedFile;
      try {
        processedFile = await this.processor.process();
      } catch (e) {
        logger.error('Could not process file.');
        throw e;
      }

      this.data = {};

      // Expose relative url to file.
      this.data.url = processedFile.destination.replace(
        config.path.destination,
        ''
      );

      fs.outputFileSync(
        processedFile.destination,
        processedFile.asset,
        'utf8'
      );
    } else {
      // If there's no processor then just copy the source to the destination.
      try {
        fs.copySync(this.config.source, this.config.destination);
      } catch (e) {
        logger.error(`Asset: Could not copy '${this.type}' assets.`);
      }
    }
  }
}
