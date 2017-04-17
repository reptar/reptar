'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

exports.renderMarkdown = renderMarkdown;
exports.createMarkdownEngine = createMarkdownEngine;

var _markdownIt = require('markdown-it');

var _markdownIt2 = _interopRequireDefault(_markdownIt);

var _markdownItPrism = require('markdown-it-prism');

var _markdownItPrism2 = _interopRequireDefault(_markdownItPrism);

var _highlight = require('highlight.js');

var _highlight2 = _interopRequireDefault(_highlight);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Default options used for Markdown engine.
 * @type {Object}
 */
const DEFAULT_OPTIONS = {
  highlight(str, lang) {
    if (lang && _highlight2.default.getLanguage(lang)) {
      try {
        return _highlight2.default.highlight(lang, str).value;
      } catch (e) {/* noop */}
    }

    try {
      return _highlight2.default.highlightAuto(str).value;
    } catch (e) {} /* noop */

    // use external default escaping
    return '';
  }
};

/**
 * Render a piece of string from Markdown to HTML.
 * @param {Object} md Markdown engine instance.
 * @param {string} str String to parse.
 * @return {string} Parsed Markdown.
 */
/**
 * Methods for interacting with our Markdown engine.
 * Supports rendering Markdown text and configure the engine.
 */
function renderMarkdown(md) {
  let str = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  return md.render(str);
}

/**
 * Create our Markdown engine.
 * @param {Object} options Configuration object.
 * @return {Object} Returns markdown engine instance.
 */
function createMarkdownEngine() {
  let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { preset: 'commonmark' };

  // If highlight is set to true then attach the highlight function handler.
  if (options.highlight === true || options.highlight === 'highlightjs') {
    options.highlight = DEFAULT_OPTIONS.highlight;
  }

  // Create markdown instance.
  const md = new _markdownIt2.default(options.preset, (0, _extends3.default)({}, options));

  if (options.highlight === 'prism') {
    md.use(_markdownItPrism2.default);
  }

  return md;
}