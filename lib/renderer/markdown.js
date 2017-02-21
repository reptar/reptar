/**
 * Methods for interacting with our Markdown engine.
 * Supports rendering Markdown text and configure the engine.
 */
import MarkdownIt from 'markdown-it';
import prism from 'markdown-it-prism';
import highlightjs from 'highlight.js';

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
  },
};

/**
 * Render a piece of string from Markdown to HTML.
 * @param {Object} md Markdown engine instance.
 * @param {string} str String to parse.
 * @return {string} Parsed Markdown.
 */
export function renderMarkdown(md, str = '') {
  return md.render(str);
}

/**
 * Create our Markdown engine.
 * @param {Object} options Configuration object.
 * @return {Object} Returns markdown engine instance.
 */
export function createMarkdownEngine(options = { preset: 'commonmark' }) {
  // If highlight is set to true then attach the highlight function handler.
  if (options.highlight === true || options.highlight === 'highlightjs') {
    options.highlight = DEFAULT_OPTIONS.highlight;
  }

  // Create markdown instance.
  const md = new MarkdownIt(options.preset, {
    ...options,
  });

  if (options.highlight === 'prism') {
    md.use(prism);
  }

  return md;
}
