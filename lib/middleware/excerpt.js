import _ from 'lodash';
import cheerio from 'cheerio';

export default function excerptMiddleware(options = {}) {
  return (reptar) => {
    _.forEach(reptar.destination, (file) => {
      const renderedFile = reptar.renderer.renderMarkdown(file.data.content);

      const $ = cheerio.load(renderedFile);
      const p = $('p').first().contents();

      // Clean text, or html enhanced text
      file.data.excerpt = options.textOnly ?
        $.text(p).trim() :
        $.html(p).trim();

      // Limits the excerpt length to your specified amount
      if (options.charLimit && file.data.excerpt.length > options.charLimit) {
        const substr = file.data.excerpt.substring(0, options.charLimit - 3);
        file.data.excerpt = `${substr}...`;
      }
    });
  };
}
