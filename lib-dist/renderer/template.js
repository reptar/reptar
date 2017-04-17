'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _groupBy2 = require('lodash/groupBy');

var _groupBy3 = _interopRequireDefault(_groupBy2);

var _last2 = require('lodash/last');

var _last3 = _interopRequireDefault(_last2);

exports.renderTemplate = renderTemplate;
exports.renderTemplateString = renderTemplateString;
exports.addTemplateFilter = addTemplateFilter;
exports.configureTemplateEngine = configureTemplateEngine;

var _nunjucks = require('nunjucks');

var _nunjucks2 = _interopRequireDefault(_nunjucks);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _url = require('../url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const TemplateErrorMessage = {
  NO_TEMPLATE: 'template not found'
};

/**
 * Render a template with given context variables.
 * @param {Object} env Nunjucks instance;
 * @param {string} template  Template name, excluding the extension.
 * @param {object} variables Object of variables to interpolate in the
 *   template.
 * @return {string} Rendered template.
 */
/**
 * Methods for rendering a template.
 */
function renderTemplate(env, template, variables) {
  if (!env) {
    return '';
  }

  let result = '';
  try {
    result = env.render(`${template}.html`, variables);
  } catch (e) {
    if (e.message.includes(TemplateErrorMessage.NO_TEMPLATE)) {
      // The message given from nunjucks looks like:
      //   Template render error: (/reptar/templates/page.html)
      //   Template render error: (/reptar/templates/page.html)
      //   Error: template not found: mistake.html
      // This takes the multi line message and just grabs the last line.
      const message = (0, _last3.default)(e.message.split('\n')).trim()
      // Format the last line of `Error: template` to remove anything
      // preceding our known error message. (Basically remove `Error: `)
      .replace(new RegExp(`.*${TemplateErrorMessage.NO_TEMPLATE}`), TemplateErrorMessage.NO_TEMPLATE);

      // Re-throw formatted error message.
      throw new Error(message);
    } else {
      throw e;
    }
  }

  return result;
}

/**
 * Render a string template with given context variables.
 * @param {Object} env Nunjucks instance;
 * @param {string} str  Template string.
 * @param {object} variables Object of variables to interpolate in the
 *   template.
 * @return {string} Rendered template.
 */
function renderTemplateString(env, str, variables) {
  if (!env) {
    return '';
  }

  return env.renderString(str, variables);
}

/**
 * Allow adding custom filters to the template engine.
 * @see {@link http://mozilla.github.io/nunjucks/api#custom-filters}
 * @param {Object} env Nunjucks instance;
 * @param {string} name Filter name.
 * @param {Function} func Filter function.
 * @param {boolean} async Whether the filter should be async.
 */
function addTemplateFilter(env, name, func) {
  let async = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  env.addFilter(name, func, async);
}

/**
 * Adds built in filters to template renderer.
 * @param {Object} env Nunjucks instance;
 * @param {Object} config Config instance.
 */
function addBuiltinFilters(env, config) {
  function dateFilter(date, momentTemplate) {
    if (date == null) {
      return '';
    }

    return (0, _moment2.default)(date, config.get('file.dateFormat')).format(momentTemplate);
  }

  [['date', dateFilter], ['groupbydate',
  // Group items by formating their date via momentjs.
  // Useful for creating archive pages:
  // eslint-disable-next-line
  // {% for date, files in collections.post.files | reverse | groupbydate('MMMM YYYY') %}
  function groupbydate(data, momentTemplate) {
    let dateKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'date';

    return (0, _groupBy3.default)(data, datum => dateFilter(datum[dateKey], momentTemplate));
  }], ['slug', function slug(str) {
    return _url2.default.slug(str);
  }], ['absolute_url', function absoluteUrl(relativePath, basePath) {
    let base = basePath || '';
    const baseLength = base.length - 1;
    base = base[baseLength] === '/' ? base.substr(0, baseLength) : base;

    let input = relativePath || '';
    const inputLength = input.length - 1;
    if (input[inputLength] !== '/') {
      input = `${input}/`;
    }
    if (input[0] !== '/') {
      input = `/${input}`;
    }

    return base + input;
  }], ['limit', function limit(arr, length) {
    return arr.slice(0, length);
  }]].forEach(filter => {
    addTemplateFilter.apply(undefined, [env].concat((0, _toConsumableArray3.default)(filter)));
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
 * @return {Object} Nunjucks instance.
 */
function configureTemplateEngine(_ref) {
  let config = _ref.config,
      paths = _ref.paths;
  var _ref$noCache = _ref.noCache;
  let noCache = _ref$noCache === undefined ? false : _ref$noCache;

  const fileSystemLoader = new _nunjucks2.default.FileSystemLoader(paths, {
    noCache
  });

  const env = new _nunjucks2.default.Environment(fileSystemLoader, {
    autoescape: false
  });

  addBuiltinFilters(env, config);

  return env;
}