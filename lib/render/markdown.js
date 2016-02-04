/**
 * Methods for interacting with our Markdown engine.
 * Supports rendering Markdown text and configure the engine.
 */
import Remarkable from 'remarkable';
import highlightjs from 'highlight.js';

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
export function render(str = '') {
  return md.render(str);
}

/**
 * Configure our Markdown engine.
 * @param {Object} options Configuration object.
 */
export function configure(options = {}) {
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

  // Disable Markdown from auto converting indented lines of text to render
  // as a <code/> block. This conflicted when rendering pages so it's being
  // disabled.
  md.block.ruler.disable(['code']);

  md.set(options);
}
