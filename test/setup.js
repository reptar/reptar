// Allow mock-fs to hijack fs module.
require('mock-fs'); // eslint-disable-line import/no-extraneous-dependencies

const fs = require('fs');

const babelRcFile = JSON.parse(
  fs.readFileSync(`${__dirname}/../.babelrc`, 'utf8')
);

babelRcFile.plugins.push('babel-plugin-espower');

require('babel-polyfill');
require('babel-register')(babelRcFile);
