const fs = require('fs');

const babelRcFile = JSON.parse(
  fs.readFileSync(`${__dirname}/../.babelrc`, 'utf8')
);

require('babel-polyfill');
require('babel-register')(babelRcFile);
