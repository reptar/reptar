const createMiddleware = val => (reptar) => {
  reptar._test.middlewares.push(val);
};

const createLifecycleMiddleware = (lifecycleName, val) => (reptar) => {
  reptar._test.lifecycle[lifecycleName].push(val);
};

module.exports = {
  site: {
    title: 'My Site Title',
    email: 'my-amazing@email.com',
    description: "Your website's description goes here.\n",
    baseurl: '',
    url: 'http://yourdomain.com',
  },
  path: {
    source: './',
    destination: './_site',
    templates: './_templates',
    data: './_data',
  },
  file: {
    url_key: 'url',
    defaults: [
      { scope: { path: './' }, values: { template: 'page' } },
      {
        scope: { path: './_posts' },
        values: { template: 'post', permalink: '/:title/' },
      },
    ],
    filters: { metadata: { draft: true }, future_date: { key: 'date' } },
  },
  collections: {
    post: {
      path: './_posts',
      template: 'index',
      page_size: 6,
      sort: { key: 'date', order: 'descending' },
      permalink: { index: '/', page: '/page/:page/' },
    },
    tag: {
      metadata: 'tags',
      template: 'tag',
      page_size: 6,
      sort: { key: 'date', order: 'descending' },
      permalink: { index: '/tag/:metadata/', page: '/tag/:metadata/:page/' },
    },
  },
  assets: [
    {
      test: 'less',
      use: 'less',
    },
    {
      test: 'js',
      use: 'browserify',
    },
  ],
  clean_destination: false,
  slug: { lower: true },
  markdown: {
    extensions: ['markdown', 'mkdown', 'mkdn', 'mkd', 'md'],
    options: { preset: 'commonmark', highlight: true },
  },
  server: { port: 8080, host: '127.0.0.1', baseurl: '' },
  new_file_permalink: '/_posts/:date|YYYY-:date|MM-:date|D-:title.md',
  middlewares: [
    createMiddleware(3),
    'my-middleware',
    createMiddleware(5),
  ],
  lifecycle: {
    willUpdate: createLifecycleMiddleware('willUpdate', 1),
    didUpdate: createLifecycleMiddleware('didUpdate', 2),
    willBuild: createLifecycleMiddleware('willBuild', 6),
    didBuild: createLifecycleMiddleware('didBuild', 7),
  }
};
