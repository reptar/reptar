require('winston').cli({
  colorize: true
});

const logger = require('winston');
const Yarn = require('./lib/index');

module.exports = async function(done) {
  logger.profile('yarn');

  let yarn = new Yarn();
  yarn.readFiles();
  await yarn.writeFiles();

  logger.profile('yarn');
  done();
};
