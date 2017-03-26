'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const middlewareOrLifecycleSchema = _joi2.default.alternatives().try(_joi2.default.string(), _joi2.default.func(), _joi2.default.array().items(_joi2.default.string(), _joi2.default.func())).default([]);

const regExpSchema = _joi2.default.object().type(RegExp);

exports.default = _joi2.default.object({
  site: _joi2.default.object().default(),
  path: _joi2.default.object({
    source: _joi2.default.string().default('./'),
    destination: _joi2.default.string().default('./_site'),
    templates: _joi2.default.string().default('./_templates'),
    data: _joi2.default.string().default('./_data')
  }).default(),
  file: _joi2.default.object({
    urlKey: _joi2.default.string().default('url'),
    dateFormat: _joi2.default.string().default('YYYY-M-D'),
    defaults: _joi2.default.array().items(_joi2.default.object({
      scope: _joi2.default.object({
        path: _joi2.default.string().allow(''),
        metadata: _joi2.default.object()
      }),
      values: _joi2.default.object()
    })).default([]),
    filters: _joi2.default.object({
      metadata: _joi2.default.object(),
      futureDate: _joi2.default.object({
        key: _joi2.default.string().default('date')
      })
    }).default({})
  }).default(),
  collections: _joi2.default.object().pattern(/\w/, _joi2.default.object({
    path: _joi2.default.string(),
    metadata: _joi2.default.string(),
    template: _joi2.default.string().default('index'),
    pageSize: _joi2.default.number().default(6),
    sort: _joi2.default.object({
      key: _joi2.default.string().default('date'),
      order: _joi2.default.string().default('descending')
    }),
    permalink: _joi2.default.object({
      index: _joi2.default.string().default('/'),
      page: _joi2.default.string().default('/page/:page/')
    })
  }).without('path', 'metadata')),
  assets: _joi2.default.array().items(_joi2.default.object({
    test: _joi2.default.alternatives().try(_joi2.default.string(), _joi2.default.func(), regExpSchema),
    use: _joi2.default.alternatives().try(_joi2.default.string(), _joi2.default.object({
      calculateDestination: _joi2.default.func().required(),
      render: _joi2.default.func().required()
    }))
  })).default([{ test: /\.less$/, use: 'less' }, { test: /\.js$/, use: 'browserify' }, { test: /\.s[ac]ss$/, use: 'sass' }]),
  cleanDestination: _joi2.default.boolean().default(false),
  slug: _joi2.default.object({
    lower: _joi2.default.boolean().default(true)
  }).default(),
  markdown: _joi2.default.object({
    extensions: _joi2.default.array().default(['markdown', 'mkdown', 'mkdn', 'mkd', 'md']),
    options: _joi2.default.object({
      preset: _joi2.default.string().default('commonmark'),
      highlight: _joi2.default.any().valid('prism', 'highlightjs', true, false).default(true)
    }).default()
  }).default(),
  server: _joi2.default.object({
    port: _joi2.default.number().default(8080),
    host: _joi2.default.string().default('127.0.0.1'),
    baseurl: _joi2.default.string().allow('').default('')
  }).default(),
  incremental: _joi2.default.boolean().default(true),
  newFilePermalink: _joi2.default.string().default('/_posts/:date|YYYY-:date|MM-:date|D-:title.md'),
  middlewares: middlewareOrLifecycleSchema,
  lifecycle: _joi2.default.object({
    willUpdate: middlewareOrLifecycleSchema,
    didUpdate: middlewareOrLifecycleSchema,
    willBuild: middlewareOrLifecycleSchema,
    didBuild: middlewareOrLifecycleSchema
  }).default()
}).default();