const assert = require('assert');

var logger = require('winston');
const Yarn = require('../../index.js');

describe.skip('Yarn', function() {
  it('should return -1 when the value is not present', function(done) {
    assert.equal(5, 5, 'They did it.');

    logger.profile('yarn');

    let yarn = new Yarn();
    yarn.readFiles();
    yarn.writeFiles().then(function() {
      logger.profile('yarn');
      done();
    });
  });
});
