import {
  parse as fromFrontMatter,
  stringify as toFrontMatter,
  fileHasFrontmatter
} from './front-matter';

import {
  parse as fromYaml,
  stringify as toYaml
} from './yaml';

export default {
  fromFrontMatter,
  toFrontMatter,
  fileHasFrontmatter,

  fromYaml,
  toYaml,
};
