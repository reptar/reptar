var logger = require('winston');
var chokidar = require('chokidar');

module.exports = function() {
  require('./serve')();

  var Yarn = require('../lib');
  var config = require('../lib/config');

  var yarn = new Yarn();
  yarn.readFiles()
    .catch(function(e) {
      console.log(e.stack);
      throw e;
    });

  chokidar.watch([
    config.path.source
  ], {
    ignored: [
      config.path.destination
    ]
  }).on('change', function(path) {
    logger.info('File changed at: ' + path);
    logger.info('Rebuilding...');
    yarn.writeFile(path).then(function() {
      logger.info('\tdone!');
    });
  });
};
