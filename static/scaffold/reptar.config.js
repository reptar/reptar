
const noopMiddleware = () => {};

module.exports = {
  // Site settings.
  // This is where you can put site-wide settings.
  // Any values placed here are globally accessible
  // from any template context via the `site` key.
  site: {
    title: 'My Reptar Title',
    email: 'your-reptar@email.com',
    description: "Your website's description goes here.\n",
    baseurl: '', // the subpath of your site, e.g. /blog
    url: 'http://yourdomain.com',
  },
  // Where things are.
  // If you have a unique layout for your site and want to
  // change where Reptar looks for certain files you can change
  // them here. All files are relative to where this file is found.
  path: {
    source: './',
    destination: './_site',
    templates: './_templates',
    data: './_data',
  },
  // Individual File configuration.
  file: {
    // The format that your date values are formatted as.
    // This is used when parsing date objects.
    // This current format supports dates like 2016-2-28
    // It uses moment.js under the head and its format syntax as well:
    // http://momentjs.com/docs/#/displaying/format/
    dateFormat: 'YYYY-M-D',
    // Apply frontmatter values to a File based upon a defined scope.
    // If the scope matches a File then the default values are applied if they
    // are not already set.
    defaults: [
      {
        // Any file in this path will have the default values applied.
        scope: { path: './' },
        values: { template: 'page', permalink: '/:title/' },
      },
      {
        // Any file in this path will have the default values applied.
        // Because this path is more specific it will over-write the previous
        // defaults.
        scope: { path: './_posts' },
        values: { template: 'post', permalink: '/:title/' },
      },
      {
        // Any file with this matching metadata will have the default values
        // applied.
        scope: { metadata: { draft: true } },
        values: { template: 'draft' },
      },
    ],
    // Filter out Files.
    filters: {
      // If any of the metadata values match then the File is filtered out.
      metadata: { draft: true },
      // If the date is in the future then it is filtered out.
      futureDate: {
        // Customize what key we should use to pull the date value from.
        key: 'date',
      },
    },
  },
  // This is where you configure your collections of content.
  // For more details refer to the Collections documentation.
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
  // If we should remove the compile destination folder before writing.
  cleanDestination: false,
  // Serving.
  // When running `reptar serve` what settings should be used.
  server: {
    port: 8080,
    host: '127.0.0.1',
    baseurl: '',
  },
  // Only build files that have changed.
  // This is a performance improvement to the time it takes to build your site.
  incremental: false,
  // What middlewares you want enabled and what configuration settings they
  // should have. Can be either a string which assumes it's an npm module or
  // a function which is the middleware itself, or an array of either.
  middlewares: [
    noopMiddleware,
  ],
  // Lifecycle methods are called at certain points in the lifecycle of Reptar.
  // Each value can be either a string or a function or an array of either.
  lifecycle: {
    willUpdate: noopMiddleware,
    didUpdate: noopMiddleware,
    willBuild: noopMiddleware,
    didBuild: noopMiddleware,
  },
};
