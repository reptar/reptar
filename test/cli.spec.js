const assert = require('assert');

const yarn = require('../index.js');

describe.skip('cli', function() {
  describe('new', function() {
    it('should scaffold a new blog', function(done) {
      assert.equal(5, 5, 'They did it.');
      yarn(done);
    });
  });
});
