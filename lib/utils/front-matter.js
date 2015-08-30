/**
 * Interface to gray-matter for parsing files with YAML frontmatter.
 */
const matter = require('gray-matter');
const jsYaml = require('js-yaml');

const frontMatterOptions = {
  parser: jsYaml.safeLoad
};

/**
 * Parse a file with front matter.
 * @param {string} str String to parse.
 * @param {Object} options Additional options.
 * @return {JSON} JSON object.
 */
exports.parse = function(str = '', options = {}) {
  return matter(str, Object.assign({}, frontMatterOptions, options));
};

/**
 * Stringify a document.
 * @param  {string} str Content to append to YAML.
 * @param  {Object} data Data to convert to YAML and prepend to document.
 * @return {string} Content with prepended YAML data.
 */
exports.stringify = function(str = '', data = {}) {
  return matter.stringify(str, data);
};
