#!/usr/bin/env node

require('babel-register');

const path = require('path');

require('./index')({
  libPath: path.join(__dirname, '..', 'lib'),
});
