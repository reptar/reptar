'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

exports.parse = parse;
exports.stringify = stringify;
exports.fileHasFrontmatter = fileHasFrontmatter;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _grayMatter = require('gray-matter');

var _grayMatter2 = _interopRequireDefault(_grayMatter);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The frontmatter delimiter character.
 * @type {string}
 */
/**
 * Interface to gray-matter for parsing files with YAML frontmatter.
 */
const FRONTMATTER_DELIMITER = '-';

const frontMatterOptions = {
  parser: _jsYaml2.default.safeLoad
};

/**
 * Parse a file with front matter.
 * @param {string} str String to parse.
 * @param {Object} options Additional options.
 * @return {JSON} JSON object.
 */
function parse() {
  let str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  return (0, _grayMatter2.default)(str, (0, _assign2.default)({}, frontMatterOptions, options));
}

/**
 * Stringify a document.
 * @param  {string} str Content to append to YAML.
 * @param  {Object} data Data to convert to YAML and prepend to document.
 * @return {string} Content with prepended YAML data.
 */
function stringify() {
  let str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  return _grayMatter2.default.stringify(str, data);
}

/**
 * This is a fast way to check if a file has frontmatter without reading all of
 * its contents into memory.
 * @param {string} filePath Path to file on the file system.
 * @return {Promise.<boolean>} Promise which resolves to true if the file has
 *   frontmatter.
 */
function fileHasFrontmatter(filePath) {
  return new _bluebird2.default((resolve, reject) => {
    let chunks = '';
    _fs2.default.createReadStream(filePath, {
      encoding: 'utf8',
      start: 0,
      // Only read the first 3 characters from the file, as those are the ones
      // which must match frontmatter delimiter.
      end: 2
    }).on('data', chunk => {
      chunks += chunk;
    }).on('close', () => {
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
    }).on('error', reject);
  });
}