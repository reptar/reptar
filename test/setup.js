const fs = require('fs');

var babelRcFile = JSON.parse(
  fs.readFileSync(__dirname + '/../.babelrc', 'utf8')
);

babelRcFile.plugins.push('babel-plugin-espower');

require('babel-polyfill');
require('babel-register')(babelRcFile);

// For now we need to ensure that our local defaults.yml file is loaded into
// our config singleton to make tests behave as expected.
// @TODO: don't require any of the following code.
const config = require('../lib/config').default;
const path = require('path');
const pathToScaffold = path.resolve(
  __dirname,
  '../node_modules/yarn-scaffold'
);
config.setRoot(pathToScaffold);