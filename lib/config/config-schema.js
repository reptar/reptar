import Joi from 'joi';

export default Joi.object({
  site: Joi.object().default(),
  path: Joi.object({
    source: Joi.string()
      .default('./'),
    destination: Joi.string()
      .default('./_site'),
    plugins: Joi.string()
      .default('./_plugins'),
    themes: Joi.string()
      .default('./_themes'),
  }).default(),
  file: Joi.object({
    url_key: Joi.string().default('url'),
    date_format: Joi.string().default('YYYY-M-D'),
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
      future_date: Joi.object({
        key: Joi.string().default('date'),
      }),
    }).default({}),
  }).default(),
  collections: Joi.object().pattern(/\w/, Joi.object({
    path: Joi.string(),
    metadata: Joi.string(),
    sort: Joi.object({
      key: Joi.string().default('date'),
      order: Joi.string().default('descending'),
    }),
    pagination: Joi.object({
      template: Joi.string().default('index'),
      size: Joi.number().default(6),
      permalink_page: Joi.string().default('/'),
      permalink_index: Joi.string().default('/page/:page/'),
    }),
  }).without('path', 'metadata')),
  theme: Joi.string().default('default'),
  clean_destination: Joi.boolean().default(false),
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
      highlight: Joi.boolean().default(true),
    }).default(),
  }).default(),
  server: Joi.object({
    port: Joi.number().default(8080),
    host: Joi.string().default('127.0.0.1'),
    baseurl: Joi.string().allow('').default(''),
  }).default(),
  quiet: Joi.boolean().default(false),
  incremental: Joi.boolean().default(true),
  new_file_permalink: Joi.string()
    .default('/_posts/:date|YYYY-:date|MM-:date|D-:title.md'),
  plugins: Joi.object().pattern(/\w/, Joi.object({
    enabled: Joi.boolean(),
    options: Joi.object(),
  })),
}).default();
