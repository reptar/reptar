import assert from 'power-assert';
import sinon from 'sinon';
import fs from 'fs';

import fixture from '../fixture';

import Url from '../../lib/url';
import * as markdown from '../../lib/render/markdown.js';
markdown.configure();

import File from '../../lib/file.js';

describe('file File', () => {
  let filePath = '/not/a/real/path';

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
      let instance = new File(filePath);

      assert.ok(instance);

      assert.equal(instance.path, filePath);
      assert.equal(instance.id, filePath);
      assert.equal(instance.rawContent, fixture.frontmatterString);
      assert.ok(instance.checksum);
      assert.ok(instance.data, fixture.frontmatterJSON.data);
      assert.ok(instance.content, fixture.frontmatterJSON.content);
    });
  });

  describe('_calculateDestination', () => {
    it('called when permalink set', () => {
      sandbox.spy(File.prototype, '_calculateDestination');

      let instance = new File(filePath);

      assert.ok(instance._calculateDestination.calledOnce);
    });

    it('allows custom file url property', () => {
      const permalinkValue = 'whee';
      let instance = new File(filePath);

      // Should use filePath when no file url or permalink is et.
      assert.equal(instance.data.url, Url.makePretty(
        Url.makeUrlFileSystemSafe(filePath)
      ));
      assert.equal(instance.url, undefined);

      // Should use permalink value when no url is set.
      instance.setPermalink(permalinkValue);
      assert.equal(instance.data.url, Url.makePretty(
        Url.makeUrlFileSystemSafe(permalinkValue)
      ));
      assert.equal(instance.url, undefined);

      // Should use File url if set.
      const customPermalinkValue = 'customPermalinkValue';
      instance.url = customPermalinkValue;
      instance.setPermalink(permalinkValue);
      assert.equal(instance.data.url, Url.makePretty(
        Url.makeUrlFileSystemSafe(customPermalinkValue)
      ));
      assert.equal(instance.url, customPermalinkValue);
    });
  });

  it('has all proper values on its data object', () => {
    let instance = new File(filePath);

    assert.strictEqual(instance.url, undefined);
    assert.equal(instance.data.url, Url.makePretty(
      Url.makeUrlFileSystemSafe(filePath)
    ));

    instance.setPermalink('whee');

    assert.deepEqual(instance.data, {
      content: markdown.render(fixture.frontmatterJSON.content),
      title: fixture.frontmatterJSON.data.title,
      url: Url.makePretty(
        Url.makeUrlFileSystemSafe(instance.permalink)
      )
    });
  });
});
