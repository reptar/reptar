/**
 * Interface to gray-matter for parsing files with YAML frontmatter.
 */
import matter from 'gray-matter';
import jsYaml from 'js-yaml';

const frontMatterOptions = {
  parser: jsYaml.safeLoad
};

/**
 * Parse a file with front matter.
 * @param {string} str String to parse.
 * @param {Object} options Additional options.
 * @return {JSON} JSON object.
 */
export function parse(str = '', options = {}) {
  return matter(str, Object.assign({}, frontMatterOptions, options));
}

/**
 * Stringify a document.
 * @param  {string} str Content to append to YAML.
 * @param  {Object} data Data to convert to YAML and prepend to document.
 * @return {string} Content with prepended YAML data.
 */
export function stringify(str = '', data = {}) {
  return matter.stringify(str, data);
}
