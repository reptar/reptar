var logger = require('winston');

var Yarn = require('../lib');

module.exports = function() {
  logger.profile('yarn');

  var yarn = new Yarn();
  yarn.readFiles()
    .then(yarn.writeFiles.bind(yarn))
    .then(function() {
      logger.profile('yarn');

      process.exit(0);
    })
    .catch(function(e) {
      console.log(e.stack);
      throw e;
    });
};