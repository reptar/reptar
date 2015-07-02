require('winston').cli({
  colorize: true
});

const Whee = require('./lib/index');

module.exports = function(done) {
  let whee = new Whee();
  whee.loadConfig(process.cwd());
  whee.readFiles();
  whee.writeFiles();
  done();
};
