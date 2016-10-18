import assert from 'power-assert';
import Url from '../../lib/url.js';

describe('url Url', function() {
  Url.setSlugOptions({
    lower: true
  });

  describe('interpolatePermalink', function() {
    it('handles simple interpolations', function() {
      assert.equal(Url.interpolatePermalink('/:title/', {
        title: 'banana'
      }), '/banana/');
    });

    it('handles duplicate param interpolations', function() {
      assert.equal(Url.interpolatePermalink('/:title/:title/', {
        title: 'banana'
      }), '/banana/banana/');
    });

    it('handles permalink with no interpolation', function() {
      assert.equal(Url.interpolatePermalink('/index.html', {
        title: 'banana'
      }), '/index.html');
    });

    it('throw if it can\'t find value to interpolate in permalink', function() {
      assert.throws(() => {
        Url.interpolatePermalink('/:title/:unknown/', {
          title: 'banana'
        });
      });
    });

    it('handles special date permalink values', function() {
      assert.equal(
        Url.interpolatePermalink('/:date|YYYY/:date|MM/:date|D/:title/', {
          title: '  In the future, the past will be history.  ',
          date: new Date('2000-02-28T00:00:00-05:00')
        }), '/2000/02/28/in-the-future-the-past-will-be-history/'
      );

      assert.equal(Url
        .interpolatePermalink('/:date_future|YYYY/:date|MM/:date|D/:title/', {
          title: 'Does jello dance, or does it just jiggle?  ',
          date: new Date('2000-02-28T00:00:00-05:00'),
          date_future: new Date('2020-10-01T00:00:00-05:00')
        }), '/2020/02/28/does-jello-dance-or-does-it-just-jiggle/');
    });
  });

  describe('replaceMarkdownExtension', function() {
    it('replaces known markdown extensions', function() {
      const markdownExtensions = [
        'md',
        'markdown',
      ];

      assert.equal(
        Url.replaceMarkdownExtension(
          '/_posts/hello-world.md',
          markdownExtensions
        ),
        '/_posts/hello-world.html'
      );

      assert.equal(
        Url.replaceMarkdownExtension(
          '/_posts/hello-world.markdown',
          markdownExtensions
        ),
        '/_posts/hello-world.html'
      );

      assert.equal(
        Url.replaceMarkdownExtension(
          '/_posts/hello-world.mkdown',
          markdownExtensions
        ),
        '/_posts/hello-world.mkdown'
      );

      assert.equal(
        Url.replaceMarkdownExtension(
          '/_posts/hello-world.html',
          markdownExtensions
        ),
        '/_posts/hello-world.html'
      );
    });
  });

  describe('makeUrlFileSystemSafe', function() {
    it('appends index.html to a url that has no file extension', function() {
      assert.equal(Url.makeUrlFileSystemSafe('/my-beautiful-html-permalink'),
        '/my-beautiful-html-permalink/index.html'
      );

      assert.equal(Url.makeUrlFileSystemSafe('/my-beautiful-html-permalink/'),
        '/my-beautiful-html-permalink/index.html'
      );

      assert.equal(Url.makeUrlFileSystemSafe('my-beautiful-html-permalink'),
        '/my-beautiful-html-permalink/index.html'
      );
    });

    it('does not append index.html to a url that does not need it', function() {
      assert.equal(Url.makeUrlFileSystemSafe('/html/goes-here.html'),
        '/html/goes-here.html'
      );

      assert.equal(Url.makeUrlFileSystemSafe('/html/image.png'),
        '/html/image.png'
      );

      assert.equal(Url.makeUrlFileSystemSafe('/html/index.gif'),
        '/html/index.gif'
      );
    });
  });

  describe('makePretty', function() {
    it('works', function() {
      let url = '/html/goes-here.html';
      assert.equal(
        Url.makePretty(url),
        url
      );

      url = '/my/beautiful-dream';
      assert.equal(
        Url.makePretty(url),
        url
      );

      url = '/have-you-got-a-minute/';
      assert.equal(
        Url.makePretty(url + 'index.html'),
        url
      );

      url = '/no-time-to-wasteindex.html';
      assert.equal(
        Url.makePretty(url),
        url
      );

      url = '/favicon.ico';
      assert.equal(
        Url.makePretty(url),
        url
      );

      url = '/images/index.gif';
      assert.equal(
        Url.makePretty(url),
        url
      );
    });
  });
});
