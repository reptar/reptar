import {
  renderMarkdown,
  createMarkdownEngine,
} from './markdown';
import {
  renderTemplate,
  renderTemplateString,
  addTemplateFilter,
  configureTemplateEngine,
} from './template';

export default class Renderer {
  constructor({ config } = {}) {
    /**
     * @type {Config}
     * @private
     */
    this._config = config;
  }

  update({ noTemplateCache }) {
    // Create markdown engine.
    this._md = createMarkdownEngine(this._config.get('markdown.options'));

    this.renderMarkdown = renderMarkdown.bind(undefined, this._md);

    // Configure template engine.
    this._nunjucksEnv = configureTemplateEngine({
      config: this._config,
      paths: this._config.get('path.templates'),
      noCache: noTemplateCache,
    });

    this.renderTemplate = renderTemplate
      .bind(undefined, this._nunjucksEnv);
    this.renderTemplateString = renderTemplateString
      .bind(undefined, this._nunjucksEnv);
    this.addTemplateFilter = addTemplateFilter
      .bind(undefined, this._nunjucksEnv);
  }

  getMarkdownEngine() {
    return this._md;
  }
}
