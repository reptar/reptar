var child_process = require('child_process');

module.exports = function() {
  var config = require('../lib/config');

  config.setRoot(config.findLocalDir());

  var destination = config.path.destination || './_site';

  child_process.spawn('http-server', [
    destination,
    '-p ' + (config.server.port || 8080),
    '-d',
    '-c-1'
  ], {
    stdio: 'inherit'
  });
};
