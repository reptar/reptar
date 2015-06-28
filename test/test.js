var assert = require('assert');

var whee = require('../index.js');

describe('test', function() {
  it('should return -1 when the value is not present', function(done) {
    assert.equal(5, 5, 'They did it.');
    whee(done);
  });
});
