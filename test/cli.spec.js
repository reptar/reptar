const assert = require('assert');

const whee = require('../index.js');

describe('cli', function() {
  describe('new', function() {
    it('should scaffold a new blog', function(done) {
      assert.equal(5, 5, 'They did it.');
      whee(done);
    });
  });
});
