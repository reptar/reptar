/**
 * Methods for rendering a template.
 */
import _ from 'lodash';
import nunjucks from 'nunjucks';
import moment from 'moment';
import Url from './url';

let env;

/**
 * Render a template with given context variables.
 * @param {string} template  Template name, excluding the extension.
 * @param {object} variables Object of variables to interpolate in the
 *   template.
 * @return {string} Rendered template.
 */
export function renderTemplate(template, variables) {
  if (!env) {
    return '';
  }

  return env.render(`${template}.html`, variables);
}

/**
 * Render a string template with given context variables.
 * @param {string} str  Template string.
 * @param {object} variables Object of variables to interpolate in the
 *   template.
 * @return {string} Rendered template.
 */
export function renderTemplateString(str, variables) {
  if (!env) {
    return '';
  }

  return env.renderString(str, variables);
}

/**
 * Allow adding custom filters to the template engine.
 * @see {@link
 *   http://mozilla.github.io/nunjucks/api#custom-filters
 * @param {string} name Filter name.
 * @param {Function} func Filter function.
 * @param {boolean} async Whether the filter should be async.
 */
export function addTemplateFilter(name, func, async = false) {
  env.addFilter(name, func, async);
}

/**
 * Adds built in filters to template renderer.
 * @param {Object} config Config instance.
 */
export function addBuiltinFilters(config) {
  function dateFilter(date, momentTemplate) {
    if (date == null) {
      return '';
    }

    return moment(date, config.get('file.date_format'))
      .format(momentTemplate);
  }

  [
    [
      'date',
      dateFilter,
    ],
    [
      'groupbydate',
      // Group items by formating their date via momentjs.
      // Useful for creating archive pages:
      // eslint-disable-next-line
      // {% for date, files in collections.post.files | reverse | groupbydate('MMMM YYYY') %}
      function(data, momentTemplate, dateKey = 'date') {
        return _.groupBy(data, (datum) =>
          dateFilter(datum[dateKey], momentTemplate)
        );
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
    ],
    [
      'limit',
      function(arr, length) {
        return arr.slice(0, length);
      }
    ]
  ].forEach(filter => {
    addTemplateFilter.apply(null, filter);
  });
}

/**
 * Exposed method to configure template engine.
 * @param {Object} options Options object with following properties:
 * @param {Object} options.config Config object.
 * @param {string|Array.<string>} options.paths Either an array of paths or a
 *   singular path that we can load templates from.
 * @param {boolean} options.noCache Whether our template engine should cache
 *   its templates. Only set to true when in watch mode.
 */
export function configureTemplateEngine({
  config,
  paths,
  noCache = false
}) {
  const fileSystemLoader = new nunjucks.FileSystemLoader(paths, {
    noCache: noCache
  });
  env = new nunjucks.Environment(fileSystemLoader, {
    autoescape: false
  });

  addBuiltinFilters(config);
}

export const TemplateErrorMessage = {
  NO_TEMPLATE: 'template not found'
};
