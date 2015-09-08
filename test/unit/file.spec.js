import {assert} from 'chai';
import sinon from 'sinon';
import fs from 'fs';

import fixture from '../fixture';

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

  it('_calculateDestination', () => {
    it('called when permalink set', () => {
      sandbox.spy(File.prototype, '_calculateDestination');

      let instance = new File(filePath);
      assert.equal(instance._calculateDestination.called, false);

      instance.permalink = 'whee';

      assert.ok(instance._calculateDestination.calledOnce);
    });
  });

  it('has all proper values on its data object', () => {
    let instance = new File(filePath);
    instance.setPermalink('whee');

    assert.deepEqual(instance.data, {
      content: markdown.render(fixture.frontmatterJSON.content),
      title: fixture.frontmatterJSON.data.title,
      url: instance.permalink
    });
  });
});
