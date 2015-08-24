const assert = require('assert');

const Theme = require('../lib/theme/index');

describe.skip('Theme', function() {
  describe('new', function() {
    it('should scaffold a new blog', async function(done) {
      assert.equal(5, 5, 'They did it.');
      let theme = new Theme();
      theme.update();
      console.log('test');
      try {
        await theme.write();
      } catch (e) {
        console.log(e.stack);
      } finally {

      }
      console.log('again');
      done();
    });
  });
});
