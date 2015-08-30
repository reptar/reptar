/**
 * Methods for interacting with our Markdown engine.
 * Supports rendering Markdown text and configure the engine.
 */
const Remarkable = require('remarkable');
const highlightjs = require('highlight.js');
let md;

/**
 * Default options used for Markdown engine.
 * @type {Object}
 */
const DEFAULT_OPTIONS = {
  highlight(str, lang) {
    if (lang && highlightjs.getLanguage(lang)) {
      try {
        return highlightjs.highlight(lang, str).value;
      } catch (e) { /* noop */ }
    }

    try {
      return highlightjs.highlightAuto(str).value;
    } catch (e) { /* noop */ }

    // use external default escaping
    return '';
  }
};

/**
 * Render a piece of string from Markdown to HTML.
 * @param {string} str String to parse.
 * @return {string} Parsed Markdown.
 */
exports.render = function(str = '') {
  return md.render(str);
};

/**
 * Configure our Markdown engine.
 * @param {Object} options Configuration object.
 */
exports.configure = function(options = {}) {
  // Lazily create markdown instance.
  if (!md) {
    md = new Remarkable(options.preset);
  }

  // Create copy.
  options = Object.assign({}, options);

  // If highlight is set to true then attach the highlight function handler.
  if (options.highlight === true) {
    options.highlight = DEFAULT_OPTIONS.highlight;
  }

  md.set(options);
};
