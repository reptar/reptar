#!/usr/bin/env node

const path = require('path');

require('./index')({
  libPath: path.join(__dirname, '..', 'lib-dist'),
});
