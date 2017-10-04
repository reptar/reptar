import Joi from 'joi';

const middlewareOrLifecycleSchema = Joi.alternatives().try(
  Joi.string(),
  Joi.func(),
  Joi.array().items(Joi.string(), Joi.func())
).default([]);

const regExpSchema = Joi.object().type(RegExp);

export default Joi.object({
  site: Joi.object().default(),
  path: Joi.object({
    source: Joi.string()
      .default('./'),
    destination: Joi.string()
      .default('./_site'),
    templates: Joi.string()
      .default('./_templates'),
    data: Joi.string()
      .default('./_data'),
  }).default(),
  file: Joi.object({
    urlKey: Joi.string().default('url'),
    dateFormat: Joi.string().default('YYYY-M-D'),
    defaults: Joi.array().items(
      Joi.object({
        scope: Joi.object({
          path: Joi.string().allow(''),
          metadata: Joi.object(),
        }),
        values: Joi.object(),
      })
    ).default([]),
    filters: Joi.object({
      metadata: Joi.object(),
      futureDate: Joi.object({
        key: Joi.string().default('date'),
      }),
    }).default({}),
  }).default(),
  collections: Joi.object().pattern(/\w/, Joi.object({
    path: Joi.string(),
    metadata: Joi.string(),
    template: Joi.string().default('index'),
    pageSize: Joi.number().default(6),
    sort: Joi.object({
      key: Joi.string().default('date'),
      order: Joi.string().default('descending'),
    }),
    permalink: Joi.object({
      index: Joi.string().default('/'),
      page: Joi.string().default('/page/:page/'),
    }),
  }).without('path', 'metadata')),
  assets: Joi.array().items(
    Joi.object({
      test: Joi.alternatives().try(
        Joi.string(),
        Joi.func(),
        regExpSchema
      ),
      use: Joi.alternatives().try(
        Joi.string(),
        Joi.object({
          calculateDestination: Joi.func().required(),
          render: Joi.func().required(),
        })
      ),
    })
  ).default([
    { test: /\.less$/, use: 'less' },
    { test: /\.js$/, use: 'browserify' },
    { test: /\.s[ac]ss$/, use: 'sass' },
  ]),
  cleanDestination: Joi.boolean().default(false),
  slug: Joi.object({
    lower: Joi.boolean().default(true),
  }).default(),
  markdown: Joi.object({
    extensions: Joi.array().default([
      'markdown',
      'mkdown',
      'mkdn',
      'mkd',
      'md',
    ]),
    options: Joi.object({
      preset: Joi.string().default('commonmark'),
      highlight: Joi.any().valid(
        'prism',
        'highlightjs',
        true,
        false
      ).default(true),
    }).unknown(true).default(),
  }).default(),
  server: Joi.object({
    port: Joi.number().default(8080),
    host: Joi.string().default('127.0.0.1'),
    baseurl: Joi.string().allow('').default(''),
  }).default(),
  ignore: Joi.array().items(
    Joi.string(),
    Joi.func(),
    regExpSchema
  ).default([]),
  incremental: Joi.boolean().default(true),
  newFilePermalink: Joi.string()
    .default('/_posts/:date|YYYY-:date|MM-:date|D-:title.md'),
  middlewares: middlewareOrLifecycleSchema,
  lifecycle: Joi.object({
    willUpdate: middlewareOrLifecycleSchema,
    didUpdate: middlewareOrLifecycleSchema,
    willBuild: middlewareOrLifecycleSchema,
    didBuild: middlewareOrLifecycleSchema,
  }).default(),
}).default();
