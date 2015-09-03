/**
 * Methods for rendering a template.
 */
import nunjucks from 'nunjucks';

let env;

/**
 * Render a template with given context variables.
 * @param {string} template  Template name, excluding the extension.
 * @param {object} variables Object of variables to interpolate in the
 *   template.
 * @param {File=} file File object used to get more information. Optional.
 * @return {string} Rendered template.
 */
export function render(template, variables, file) {
  if (!env) {
    return '';
  }

  if (template) {
    return env.render(`${template}.html`, variables);
  } else {
    return env.renderString(file.content, variables);
  }
}

/**
 * Exposed method to configure template engine.
 * @param {string|Array.<string>} paths Either an array of paths or a singular
 *   path that we can load templates from.
 */
export function configure(paths) {
  env = new nunjucks.Environment(new nunjucks.FileSystemLoader(paths), {
    autoescape: false
  });
}

/**
 * Allow adding custom filters to the template engine.
 * @see {@link
 *   http://mozilla.github.io/nunjucks/api#custom-filters
 * @param {string} name Filte rname.
 * @param {Function} func Filter function.
 * @param {boolean} async Whether the filter should be async.
 */
export function addFilter(name, func, async = false) {
  env.addFilter(name, func, async);
}
