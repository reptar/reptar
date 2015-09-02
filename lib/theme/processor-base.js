import path from 'path';
import crypto from 'crypto';

export default class ProcessorBase {
  constructor(asset) {
    /**
     * The asset we're processing.
     * @type {Asset}
     * @private
     */
    this._asset = asset;

    /**
     * Path from where to read the asset.
     * @type {string}
     */
    this.assetSource = this._asset.config.source;

    /**
     * Path of where to write the asset.
     * @type {string}
     */
    this.assetDestination = this._asset.config.destination;

    /**
     * What plugins to apply to the processor.
     * @type {Object}
     */
    this.plugins = this._asset.config.processor.plugins;

    /**
     * Whether we should hash the file name.
     * @type {boolean}
     */
    this.shouldHash = this._asset.config.processor.hash;
  }

  /**
   * Public API that is used to process the asset.
   * @return {Promise} Returns a promise that resolves with the destination
   *  and actual content of the processed asset.
   */
  async process() {
    let asset = await this._getFile();

    let destination = this._getDestination(asset);

    if (this.shouldHash) {
      this.checksum = crypto.createHash('md5')
        .update(asset, 'utf8').digest('hex').slice(0, 10);

      // Get destination extension, i.e. `.css`.
      let extension = path.extname(destination);

      // Append checksum to path.
      destination = destination.replace(
        new RegExp(extension + '$'),
        `-${this.checksum}${extension}`
      );
    }

    return {
      destination,
      asset
    };
  }

  _getDestination() {
    return this.assetDestination;
  }
}
