var child_process = require('child_process');

module.exports = function() {
  var config = require('../lib/config');
  var destination = config.path.destination || './_site';

  child_process.spawn('http-server', [
    destination, // Path to serve from.
    '-p 8080',   // Use port 8080.
    '-d',        // Show directory listings.
    '-c-1'       // Disable caching.
  ], {
    stdio: 'inherit'
  });
};
