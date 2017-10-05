/**
 * Interface to gray-matter for parsing files with YAML frontmatter.
 */
import Promise from 'bluebird';
import fs from 'fs';
import matter from 'gray-matter';
import jsYaml from 'js-yaml';

/**
 * The frontmatter delimiter character.
 * @type {string}
 */
const FRONTMATTER_DELIMITER = '-';

const frontMatterOptions = {
  parser: jsYaml.safeLoad,
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

/**
 * This is a fast way to check if a file has frontmatter without reading all of
 * its contents into memory.
 * @param {string} filePath Path to file on the file system.
 * @return {Promise.<boolean>} Promise which resolves to true if the file has
 *   frontmatter.
 */
export function fileHasFrontmatter(filePath) {
  return new Promise((resolve, reject) => {
    let chunks = '';
    fs
      .createReadStream(filePath, {
        encoding: 'utf8',
        start: 0,
        // Only read the first 3 characters from the file, as those are the ones
        // which must match frontmatter delimiter.
        end: 2,
      })
      .on('data', chunk => {
        chunks += chunk;
      })
      .on('close', () => {
        for (const char of chunks) {
          // If one character doesn't match then this file doesn't have
          // frontmatter.
          if (char !== FRONTMATTER_DELIMITER) {
            resolve(false);
            return;
          }
        }

        // If every character matches then this file has frontmatter.
        resolve(true);
      })
      .on('error', reject);
  });
}
