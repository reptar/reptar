const createMiddleware = val => (reptar) => {
  if (!reptar._test) {
    return;
  }
  reptar._test.middlewares.push(val);
};

const createLifecycleMiddleware = (lifecycleName, val) => (reptar) => {
  if (!reptar._test) {
    return;
  }
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
    urlKey: 'url',
    defaults: [
      { scope: { path: './' }, values: { template: 'page' } },
      {
        scope: { path: './_posts' },
        values: { template: 'post', permalink: '/:title/' },
      },
    ],
    filters: { metadata: { draft: true }, futureDate: { key: 'date' } },
  },
  collections: {
    post: {
      path: './_posts',
      template: 'index',
      pageSize: 6,
      sort: { key: 'date', order: 'descending' },
      permalink: { index: '/', page: '/page/:page/' },
    },
    tag: {
      metadata: 'tags',
      template: 'tag',
      pageSize: 6,
      sort: { key: 'date', order: 'descending' },
      permalink: { index: '/tag/:metadata/', page: '/tag/:metadata/:page/' },
    },
  },
  cleanDestination: false,
  slug: { lower: true },
  markdown: {
    extensions: ['markdown', 'mkdown', 'mkdn', 'mkd', 'md'],
    options: { preset: 'commonmark', highlight: true },
  },
  ignore: [
    /_.+.less/
  ],
  server: { port: 8080, host: '127.0.0.1', baseurl: '' },
  newFilePermalink: '/_posts/:date|YYYY-:date|MM-:date|D-:title.md',
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
