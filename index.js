require('winston').cli({
  colorize: true
});

const Yarn = require('./lib/index');

module.exports = function(done) {
  let yarn = new Yarn();
  yarn.loadConfig(process.cwd());
  yarn.readFiles();
  yarn.writeFiles();
  done();
};
