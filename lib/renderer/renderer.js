import {
  renderMarkdown,
  createMarkdownEngine,
} from './markdown';

export default class Renderer {
  constructor({ config, pluginManager } = {}) {
    /**
     * @type {Config}
     * @private
     */
    this._config = config;

    /**
     * @type {PluginManager}
     * @private
     */
    this._pluginManager = pluginManager;
  }

  update() {
    // Create markdown engine.
    this._md = createMarkdownEngine(this._config.get('markdown.options'));

    this.renderMarkdown = renderMarkdown.bind(undefined, this._md);
  }

  getMarkdownEngine() {
    return this._md;
  }

  /**
   * Write a file to the file system. Calls all plugin events.
   * @param {(File|CollectionPage)} file File or CollectionPage object.
   * @param {Object} siteData Site wide template data.
   * @param {PluginEvents} eventBefore Which event handler to process before
   *   rendering the file.
   * @param {PluginEvents} eventAfter Which event handler to process after
   *   rendering the file.
   * @return {Promise}
   */
  async renderFileWithPlugins(
    file,
    siteData,
    eventBefore,
    eventAfter
  ) {
    if (eventBefore) {
      await this._pluginManager.eventHandler.processEventHandlers(
        eventBefore,
        file
      );
    }

    let renderedFile = file.render(siteData);

    if (eventAfter) {
      [
        file, // eslint-disable-line no-param-reassign
        renderedFile,
      ] = await this._pluginManager.eventHandler.processEventHandlers(
        eventAfter,
        file,
        renderedFile
      );
    }

    return [file, renderedFile];
  }
}
