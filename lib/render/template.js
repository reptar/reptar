/**
 * Methods for rendering a template.
 */
import nunjucks from 'nunjucks';
import moment from 'moment';
import Url from '../url';

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
 * Allow adding custom filters to the template engine.
 * @see {@link
 *   http://mozilla.github.io/nunjucks/api#custom-filters
 * @param {string} name Filter name.
 * @param {Function} func Filter function.
 * @param {boolean} async Whether the filter should be async.
 */
export function addFilter(name, func, async = false) {
  env.addFilter(name, func, async);
}

/**
 * Adds built in filters to template renderer.
 */
export function addBuiltinFilters() {
  [
    [
      'date',
      function(date, momentTemplate) {
        return moment(date).format(momentTemplate);
      }
    ],
    [
      'slug',
      function(str) {
        return Url.slug(str);
      }
    ],
    [
      'absolute_url',
      function(relativePath, basePath) {
        var base = basePath || '';
        var baseLength = base.length - 1;
        base = base[baseLength] === '/' ? base.substr(0, baseLength) : base;

        var input = relativePath || '';
        var inputLength = input.length - 1;
        if (input[inputLength] !== '/') {
          input = input + '/';
        }
        if (input[0] !== '/') {
          input = '/' + input;
        }

        return base + input;
      }
    ]
  ].forEach(filter => {
    addFilter.apply(null, filter);
  });
}

/**
 * Exposed method to configure template engine.
 * @param {Object} options Options object with following properties:
 *   @param {string|Array.<string>} paths Either an array of paths or a singular
 *     path that we can load templates from.
 *   @param {boolean} cacheTemplates Whether our template engine should cache
 *     its templates. Only set to false when in watch mode.
 */
export function configure({
  paths,
  cacheTemplates = false
}) {
  let fileSystemLoader = new nunjucks.FileSystemLoader(paths, {
    noCache: cacheTemplates
  });
  env = new nunjucks.Environment(fileSystemLoader, {
    autoescape: false
  });

  addBuiltinFilters();
}