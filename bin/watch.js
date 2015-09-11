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

  var watcher = chokidar.watch([
    config.path.source
  ], {
    ignored: [
      config.path.destination
    ]
  });

  // Wait for watcher to be ready before registering other watchers.
  watcher.on('ready', function() {

    watcher.on('change', function(path) {
      logger.info('File changed at: ' + path);
      logger.info('Rebuilding...');
      yarn.fileChanged(path).then(function() {
        logger.info('\tdone!');
      });
    });

  });
};
