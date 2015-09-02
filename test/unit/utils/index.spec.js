import {assert} from 'chai';
const utils = require('../../../lib/utils/index.js');

describe('utils/index', function() {

  describe('interpolatePermalink', function() {
    it('handles simple interpolations', function() {
      assert.equal(utils.interpolatePermalink('/:title/', {
        title: 'banana'
      }), '/banana/');
    });

    it('handles duplicate param interpolations', function() {
      assert.equal(utils.interpolatePermalink('/:title/:title/', {
        title: 'banana'
      }), '/banana/banana/');
    });

    it('handles permalink with no interpolation', function() {
      assert.equal(utils.interpolatePermalink('/index.html', {
        title: 'banana'
      }), '/index.html');
    });

    it(`throws if it can't find value to interpolate in permalink`, function() {
      assert.throws(() => {
        utils.interpolatePermalink('/:title/:unknown/', {
          title: 'banana'
        });
      });
    });

    it('handles special date permalink values', function() {
      assert.equal(
        utils.interpolatePermalink('/:date|YYYY/:date|MM/:date|D/:title/', {
          title: '  In the future, the past will be history.  ',
          date: new Date('2000-02-28T00:00:00-05:00')
        }), '/2000/02/28/in-the-future-the-past-will-be-history/'
      );

      assert.equal(utils
        .interpolatePermalink('/:date_future|YYYY/:date|MM/:date|D/:title/', {
          title: 'Does jello dance, or does it just jiggle?  ',
          date: new Date('2000-02-28T00:00:00-05:00'),
          date_future: new Date('2020-10-01T00:00:00-05:00')
        }), '/2020/02/28/does-jello-dance-or-does-it-just-jiggle/');
    });
  });

  describe('stringToSlug', function() {
    it('correctly makes a string into a slug', function() {
      assert.equal(
        utils.stringToSlug('?  ? Did you, uh, do that on purpose?   !'),
        'did-you-uh-do-that-on-purpose'
      );
    });
  });

  describe('makeUrlFileSystemSafe', function() {
    it('appends index.html to a url that has no file extension', function() {
      assert.equal(utils.makeUrlFileSystemSafe('/my-beautiful-html-permalink'),
        '/my-beautiful-html-permalink/index.html'
      );

      assert.equal(utils.makeUrlFileSystemSafe('/my-beautiful-html-permalink/'),
        '/my-beautiful-html-permalink/index.html'
      );
    });

    it('does not append index.html to a url that does not need it', function() {
      assert.equal(utils.makeUrlFileSystemSafe('/html/goes-here.html'),
        '/html/goes-here.html'
      );
    });
  });
});
