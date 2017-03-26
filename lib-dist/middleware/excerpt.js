'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = excerptMiddleware;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function excerptMiddleware() {
  let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return reptar => {
    _lodash2.default.forEach(reptar.destination, file => {
      const renderedFile = reptar.renderer.renderMarkdown(file.data.content);

      const $ = _cheerio2.default.load(renderedFile);
      const p = $('p').first().contents();

      // Clean text, or html enhanced text
      file.data.excerpt = options.textOnly ? $.text(p).trim() : $.html(p).trim();

      // Limits the excerpt length to your specified amount
      if (options.charLimit && file.data.excerpt.length > options.charLimit) {
        const substr = file.data.excerpt.substring(0, options.charLimit - 3);
        file.data.excerpt = `${substr}...`;
      }
    });
  };
}