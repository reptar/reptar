import fs from 'fs-extra';
import _ from 'lodash';

import log from '../log';
import browserify from './processor/browserify';
import less from './processor/less';
import sass from './processor/sass';

const processors = {
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
      const processorName = this.config.processor.name;
      const ProcessorClass = processors[processorName];

      if (_.isUndefined(ProcessorClass)) {
        const msg = `Could not load processer '${processorName}'. Aborting.`;
        log.error(msg);
        throw new Error(msg);
      }

      /**
       * Asset processor.
       * @type {Processor}
       */
      this.processor = new ProcessorClass(this);

      /**
       * Asset destination where it should be written to.
       * @type {string}
       */
      this.destination;

      /**
       * The processed Asset content.
       * @type {string}
       */
      this.content;
    }

    /**
     * Data accessible to templates.
     * @type {Object}
     */
    this.data = Object.create(null);
  }

  async process(pathDestination) {
    if (!this.processor) {
      return;
    }

    try {
      const processedFile = await this.processor.process();

      this.destination = processedFile.destination;
      this.content = processedFile.asset;
    } catch (e) {
      log.error('Could not process file.');
      throw e;
    }

    // Expose relative url to file.
    this.data.url = this.destination.replace(pathDestination, '');
  }

  async write() {
    // If there is a processor let it handle writing the file.
    if (this.processor) {
      if (!(this.destination || this.content)) {
        log.warn(`Asset: ${this.id} found no processed file when about ` +
          'to write asset to disk. Processing now.');
        await this.process();
      }

      fs.outputFileSync(this.destination, this.content, 'utf8');
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
