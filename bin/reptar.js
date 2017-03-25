#!/usr/bin/env node
/* eslint-disable global-require */

require('babel-polyfill');

const path = require('path');

require('./index')({
  log: require('../lib-dist/log').default,
  libPath: path.join(__dirname, '..', 'lib-dist'),
});
