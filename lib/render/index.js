import {
  configure as configureMarkdown,
  render as fromMarkdown
} from './markdown';

import {
  configure as configureTemplate,
  addFilter as addTemplateFilter,
  render as fromTemplate
} from './template';

export default {
  configureMarkdown,
  fromMarkdown,

  configureTemplate,
  addTemplateFilter,
  fromTemplate
};
