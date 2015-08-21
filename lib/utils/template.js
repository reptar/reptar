/**
 * Methods for rendering a template.
 */
const nunjucks = require('nunjucks');

let env;

/**
 * Render a template with given context variables.
 * @param {string} template  Template name, excluding the extension.
 * @param {object} variables Object of variables to interpolate in the
 *   template.
 * @return {string} Rendered template.
 */
exports.render = function(template, variables) {
  if (!env) {
    return '';
  }

  return env.render(`${template}.html`, variables);
};

/**
 * Exposed method to configure template engine.
 * @param {string|Array.<string>} paths Either an array of paths or a singular
 *   path that we can load templates from.
 */
exports.configure = function(paths) {
  env = new nunjucks.Environment(new nunjucks.FileSystemLoader(paths));
};

/**
 * Allow adding custom filters to the template engine.
 * @see {@link
 *   http://mozilla.github.io/nunjucks/api#custom-filters
 * @param {string} name Filte rname.
 * @param {Function} func Filter function.
 * @param {boolean} async Whether the filter should be async.
 */
exports.addFilter = function(name, func, async = false) {
  env.addFilter(name, func, async);
};

// Add default filters.

// {{date | date('Y-m-d')}}
const moment = require('moment');
exports.defaultFilters = [
  [
    'date',
    function(date, momentTemplate) {
      return moment(date).format(momentTemplate);
    }
  ],

  [
    'absolute_url',
    function(val) {
      return val;
    }
  ],

  [
    'striptags',
    function(val) {
      return val;
    }
  ]
];