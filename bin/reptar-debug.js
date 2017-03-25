#!/usr/bin/env node
/* eslint-disable global-require */

require('babel-register');

const path = require('path');

require('./index')({
  log: require('../lib/log').default,
  libPath: path.join(__dirname, '..', 'lib'),
});
