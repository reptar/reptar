import fs from 'fs';
import path from 'path';
import {
  parse as fromFrontMatter,
  stringify as toFrontMatter,
  fileHasFrontmatter,
} from './front-matter';

import { parse as fromYaml, stringify as toYaml } from './yaml';

// Supported extension parsers.
const ExtensionParser = {
  json(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  },
  yaml(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return fromYaml(content);
  },
};
// Alias yml to yaml.
ExtensionParser.yml = ExtensionParser.yaml;

export default {
  fromFrontMatter,
  toFrontMatter,
  fileHasFrontmatter,

  fromYaml,
  toYaml,

  /**
   * Intelligently parses a file and returns a JS object. It checks the
   * extension and uses the correct mechanism for parsing the file.
   * @param {string} filePath Full path to file.
   * @return {Object} POJO.
   */
  smartLoadAndParse(filePath) {
    const extension = path.extname(filePath).replace('.', '');
    const parser = ExtensionParser[extension];
    if (parser == null) {
      return {};
    }
    return parser(filePath);
  },
};
