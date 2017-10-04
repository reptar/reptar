'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _frontMatter = require('./front-matter');

var _yaml = require('./yaml');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Supported extension parsers.
const ExtensionParser = {
  json(filePath) {
    const content = _fs2.default.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  },
  yaml(filePath) {
    const content = _fs2.default.readFileSync(filePath, 'utf8');
    return (0, _yaml.parse)(content);
  }
};
// Alias yml to yaml.
ExtensionParser.yml = ExtensionParser.yaml;

exports.default = {
  fromFrontMatter: _frontMatter.parse,
  toFrontMatter: _frontMatter.stringify,
  fileHasFrontmatter: _frontMatter.fileHasFrontmatter,

  fromYaml: _yaml.parse,
  toYaml: _yaml.stringify,

  /**
   * Intelligently parses a file and returns a JS object. It checks the
   * extension and uses the correct mechanism for parsing the file.
   * @param {string} filePath Full path to file.
   * @return {Object} POJO.
   */
  smartLoadAndParse(filePath) {
    const extension = _path2.default.extname(filePath).replace('.', '');
    const parser = ExtensionParser[extension];
    if (parser == null) {
      return {};
    }
    return parser(filePath);
  }
};