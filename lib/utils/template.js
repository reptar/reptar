/**
 * Methods for rendering a template.
 */
const nunjucks = require('nunjucks');

/**
 * Render a template with given context variables.
 * @param {string} template  Template name, excluding the extension.
 * @param {object} variables Object of variables to interpolate in the
 *   template.
 * @return {string} Rendered template.
 */
exports.render = function(template, variables) {
  return nunjucks.render(`${template}.html`, variables);
};


/**
 * Exposed method to configure template engine..
 */
exports.configure = function() {
  nunjucks.configure.apply(nunjucks, arguments);
};

