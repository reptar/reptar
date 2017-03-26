'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _markdown = require('./markdown');

var _template = require('./template');

class Renderer {
  constructor() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    let config = _ref.config;

    /**
     * @type {Config}
     * @private
     */
    this._config = config;
  }

  update(_ref2) {
    let noTemplateCache = _ref2.noTemplateCache;

    // Create markdown engine.
    this._md = (0, _markdown.createMarkdownEngine)(this._config.get('markdown.options'));

    this.renderMarkdown = _markdown.renderMarkdown.bind(undefined, this._md);

    // Configure template engine.
    this._nunjucksEnv = (0, _template.configureTemplateEngine)({
      config: this._config,
      paths: this._config.get('path.templates'),
      noCache: noTemplateCache
    });

    this.renderTemplate = _template.renderTemplate.bind(undefined, this._nunjucksEnv);
    this.renderTemplateString = _template.renderTemplateString.bind(undefined, this._nunjucksEnv);
    this.addTemplateFilter = _template.addTemplateFilter.bind(undefined, this._nunjucksEnv);
  }

  getMarkdownEngine() {
    return this._md;
  }
}
exports.default = Renderer;