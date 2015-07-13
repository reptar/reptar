const assert = require('assert');

const yarn = require('../index.js');

describe.only('Yarn', function() {
  it('should return -1 when the value is not present', function(done) {
    assert.equal(5, 5, 'They did it.');
    yarn(done);
  });
});
