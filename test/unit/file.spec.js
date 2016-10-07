import _ from 'lodash';
import assert from 'power-assert';
import path from 'path';
import sinon from 'sinon';
import fs from 'fs';

import fixture from '../fixture';
import {
  createMockConfig,
} from '../utils';

import Url from '../../lib/url';
import {configureMarkdownEngine} from '../../lib/markdown.js';
configureMarkdownEngine();

import File from '../../lib/file.js';

describe('file File', () => {
  const filePath = '/fixture/_posts/hello-world.md';

  const config = createMockConfig();
  const getConfig = () => config;

  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    sandbox.stub(fs, 'readFileSync')
      .withArgs(filePath, 'utf8').returns(fixture.frontmatterString);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('can create an instance', () => {
      const instance = new File(filePath, getConfig);

      assert.ok(instance);

      assert.equal(instance.path, filePath);
      assert.equal(instance.id, filePath);
      assert.ok(instance.checksum);
      assert.ok(instance.data, fixture.frontmatterJSON.data);
      assert.ok(instance.data.content, fixture.frontmatterJSON.content);
    });

    it('calculates destination path', () => {
      sandbox.spy(File.prototype, '_calculateDestination');

      const instance = new File(filePath, getConfig);

      assert.ok(instance._calculateDestination.calledOnce);
      assert.ok(instance.destination);
    });
  });

  describe('default values from config', () => {
    const defaults = [
      {
        scope: {
          path: '',
        },
        values: {
          post: false,
        }
      },
      {
        scope: {
          path: '_posts',
          metadata: {
            draft: false,
          },
        },
        values: {
          post: true,
          layout: 'post',
        }
      },
      {
        scope: {
          path: '_posts/2016',
        },
        values: {
          newAge: true,
        }
      },
    ];
    const config = createMockConfig({
      file: {
        defaults,
      },
    });
    const getConfig = () => config;

    function createFile(filePathParts, additionalFrontmatter = {}) {
      sandbox.restore();

      const filePath = path.join(config.get('path.source'), ...filePathParts);

      sandbox.stub(fs, 'readFileSync')
        .withArgs(filePath, 'utf8').returns(fixture.frontmatterString);

      const instance = new File(filePath, getConfig);
      _.extend(instance.frontmatter, additionalFrontmatter);
      instance.defaults = instance._gatherDefaults();
      // Mimic internal File.update behavior to copy over data.
      _.merge(instance.data, instance.defaults, instance.frontmatter);

      return instance;
    }

    it('applies default values that match', () => {
      [
        [
          createFile(['..', 'test.md']),
          {},
        ],
        [
          createFile(['_posts', 'hello-world.md'], {
            draft: true,
          }),
          _.defaults(
            defaults[0].values,
          )
        ],
        [
          createFile(['_posts', 'hello-world.md'], {
            draft: false,
          }),
          _.defaults(
            defaults[1].values,
            defaults[0].values,
          )
        ],
        [
          createFile(['_posts', '2016', 'its-me-again.md'], {
            draft: false,
            pleasant: 'dreams',
          }),
          _.defaults(
            defaults[2].values,
            defaults[1].values,
            defaults[0].values,
          )
        ],
      ].forEach(([instance, expectedValue]) => {
        assert.deepEqual(instance.defaults, expectedValue);
        assert.ok(_.isMatch(instance.data, instance.frontmatter));

        // Make sure that for every expected default it should at least exist
        // as a property on the data object. The value might be different
        // depending if it is over-written but it should exist.
        Object.keys(expectedValue).forEach(expectedKey => {
          assert.ok(instance.data[expectedKey] != null);
        });
      });
    });
  });

  describe('_calculateDestination', () => {
    it('allows custom file url property', () => {
      const permalinkValue = 'whee';
      const instance = new File(filePath, getConfig);

      // Should use filePath when no file url or permalink is et.
      assert.equal(instance.data.url, Url.makePretty(
        Url.makeUrlFileSystemSafe(
          Url.replaceMarkdownExtension(
            filePath,
            instance._getConfig().get('markdown_extension')
          )
        )
      ));
      assert.equal(instance.url, undefined);

      // Should use permalink value when no url is set.
      instance.permalink = permalinkValue;
      instance._calculateDestination();
      assert.equal(instance.data.url, Url.makePretty(
        Url.makeUrlFileSystemSafe(permalinkValue)
      ));
      assert.equal(instance.url, undefined);

      // Should use File url if set.
      const customPermalinkValue = 'customPermalinkValue';
      instance.frontmatter.url = customPermalinkValue;
      instance.permalink = permalinkValue;
      instance._calculateDestination();
      assert.equal(instance.data.url, Url.makePretty(
        Url.makeUrlFileSystemSafe(customPermalinkValue)
      ));
      assert.equal(instance.frontmatter.url, customPermalinkValue);
    });
  });

  it('has all proper values on its data object', () => {
    const instance = new File(filePath, getConfig);

    assert.strictEqual(instance.url, undefined);
    assert.equal(instance.data.url, Url.makePretty(
      Url.makeUrlFileSystemSafe(
        Url.replaceMarkdownExtension(
          filePath,
          instance._getConfig().get('markdown_extension')
        )
      )
    ));

    instance.permalink = 'whee';
    instance._calculateDestination();

    assert.deepEqual(instance.data, {
      content: fixture.frontmatterJSON.content,
      title: fixture.frontmatterJSON.data.title,
      url: Url.makePretty(
        Url.makeUrlFileSystemSafe(instance.permalink)
      )
    });
  });
});
