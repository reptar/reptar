import _ from 'lodash';
import assert from 'power-assert';
import path from 'path';
import sinon from 'sinon';
import fs from 'fs-extra';

import fixture from '../fixture';
import {
  createMockConfig,
} from '../utils';

import Url from '../../lib/url';
import Parse from '../../lib/parse';
import File from '../../lib/file';
import { createMarkdownEngine } from '../../lib/markdown';

createMarkdownEngine();

describe('file File', () => {
  const filePath = '/fixture/_posts/hello-world.md';

  let config;

  let sandbox;
  beforeEach(() => {
    config = createMockConfig();

    sandbox = sinon.sandbox.create();

    const readFileStub = (file, opts, cb) =>
      cb(null, fixture.frontmatterString);

    sandbox.stub(fs, 'readFile', readFileStub)
      .withArgs(filePath, 'utf8');

    sandbox.stub(Parse, 'fileHasFrontmatter').returns(true);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('can create an instance', async () => {
      const instance = new File(filePath, {
        config,
      });
      await instance.update();

      assert.ok(instance);

      assert.equal(instance.path, filePath);
      assert.equal(instance.id, filePath);
      assert.ok(instance.checksum);
      assert.ok(instance.data, fixture.frontmatterJSON.data);
      assert.ok(instance.data.content, fixture.frontmatterJSON.content);
    });

    it('calculates destination path', async () => {
      sandbox.spy(File.prototype, '_calculateDestination');

      const instance = new File(filePath, {
        config,
      });
      await instance.update();

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
        },
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
        },
      },
      {
        scope: {
          path: '_posts/2016',
        },
        values: {
          newAge: true,
        },
      },
    ];
    // eslint-disable-next-line no-shadow
    const config = createMockConfig({
      file: {
        defaults,
      },
    });

    function createFile(filePathParts, additionalFrontmatter = {}) {
      return async () => {
        sandbox.restore();

        // eslint-disable-next-line no-shadow
        const filePath = path.join(config.get('path.source'), ...filePathParts);

        const readFileStub = (file, opts, cb) =>
          cb(null, fixture.frontmatterString);

        sandbox.stub(fs, 'readFile', readFileStub)
          .withArgs(filePath, 'utf8');
        sandbox.stub(Parse, 'fileHasFrontmatter').returns(true);

        const instance = new File(filePath, {
          config,
        });
        await instance.update();
        _.extend(instance.frontmatter, additionalFrontmatter);
        instance.defaults = instance._gatherDefaults();
        // Mimic internal File.update behavior to copy over data.
        _.merge(instance.data, instance.defaults, instance.frontmatter);

        return instance;
      };
    }

    it('applies default values that match', () => {
      const promises = [
        [
          createFile(['..', 'test.md']),
          {},
        ],
        [
          createFile(['_posts', 'hello-world.md'], {
            draft: true,
          }),
          _.defaults(
            defaults[0].values
          ),
        ],
        [
          createFile(['_posts', 'hello-world.md'], {
            draft: false,
          }),
          _.defaults(
            defaults[1].values,
            defaults[0].values
          ),
        ],
        [
          createFile(['_posts', '2016', 'its-me-again.md'], {
            draft: false,
            pleasant: 'dreams',
          }),
          _.defaults(
            defaults[2].values,
            defaults[1].values,
            defaults[0].values
          ),
        ],
      ].map(async ([creator, expectedValue]) => {
        const instance = await creator();
        assert.deepEqual(instance.defaults, expectedValue);
        assert.ok(_.isMatch(instance.data, instance.frontmatter));

        // Make sure that for every expected default it should at least exist
        // as a property on the data object. The value might be different
        // depending if it is over-written but it should exist.
        Object.keys(expectedValue).forEach((expectedKey) => {
          assert.ok(instance.data[expectedKey] != null);
        });
      });

      return Promise.all(promises);
    });
  });

  describe('_calculateDestination', () => {
    it('allows custom file url property', async () => {
      const permalinkValue = 'whee';
      const instance = new File(filePath, {
        config,
      });
      await instance.update();

      // Should use filePath when no file url or permalink is et.
      assert.equal(instance.data.url, Url.makePretty(
        Url.makeUrlFileSystemSafe(
          Url.replaceMarkdownExtension(
            filePath,
            instance._config.get('markdown.extensions')
          )
        )
      ));
      assert.equal(instance.url, undefined);

      // Should use permalink value when no url is set.
      instance.data.permalink = permalinkValue;
      instance._calculateDestination();
      assert.equal(instance.data.url, Url.makePretty(
        Url.makeUrlFileSystemSafe(permalinkValue)
      ));
      assert.equal(instance.url, undefined);

      // Should use File url if set.
      const customPermalinkValue = 'customPermalinkValue';
      instance.frontmatter.url = customPermalinkValue;
      instance.data.permalink = permalinkValue;
      instance._calculateDestination();
      assert.equal(instance.data.url, Url.makePretty(
        Url.makeUrlFileSystemSafe(customPermalinkValue)
      ));
      assert.equal(instance.frontmatter.url, customPermalinkValue);
    });
  });

  it('has all proper values on its data object', async () => {
    const instance = new File(filePath, {
      config,
    });
    await instance.update();

    assert.strictEqual(instance.url, undefined);
    assert.equal(instance.data.url, Url.makePretty(
      Url.makeUrlFileSystemSafe(
        Url.replaceMarkdownExtension(
          filePath,
          instance._config.get('markdown.extensions')
        )
      )
    ));

    const permalink = 'whee';
    instance.data.permalink = permalink;
    instance._calculateDestination();

    assert.deepEqual(instance.data, {
      content: fixture.frontmatterJSON.content,
      ...fixture.frontmatterJSON.data,
      permalink,
      url: Url.makePretty(
        Url.makeUrlFileSystemSafe(instance.data.permalink)
      ),
    });
  });

  describe('filtered', () => {
    it('set correctly', async () => {
      const instance = new File(filePath, {
        config,
      });

      await instance.update();
      assert.equal(instance.filtered, false);

      config._raw.file.filters = {
        metadata: {
          draft: false,
        },
      };
      await instance.update();
      assert.equal(instance.filtered, false);

      config._raw.file.filters = {
        metadata: {
          draft: true,
        },
      };
      await instance.update();
      assert.equal(instance.filtered, true);

      config._raw.file.filters = {
        future_date: {
          key: 'draft',
        },
      };
      await instance.update();
      assert.equal(instance.filtered, false);

      config._raw.file.filters = {
        future_date: {
          key: 'future_date',
        },
      };
      await instance.update();
      assert.equal(instance.filtered, true);

      config._raw.file.filters = {
        future_date: {
          key: 'date',
        },
      };
      await instance.update();
      assert.equal(instance.filtered, false);
    });
  });
});
