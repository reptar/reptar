import {
  configure as configureMarkdown,
  render as fromMarkdown
} from './markdown';

import {
  configure as configureTemplate,
  addFilter as addTemplateFilter,
  render as fromTemplate,
  renderString as fromTemplateString,
  ErrorMessage as TemplateErrorMessage,
} from './template';

export default {
  configureMarkdown,
  fromMarkdown,

  configureTemplate,
  addTemplateFilter,
  fromTemplate,
  fromTemplateString,
  TemplateErrorMessage,
};
