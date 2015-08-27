const assert = require('chai').assert;
const sinon = require('sinon');
const fs = require('fs');

const fixture = require('../fixture');

const markdown = require('../../lib/utils/markdown.js');
markdown.configure();

const File = require('../../lib/file.js');

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

  it('calculateDestination', () => {
    it('called when permalink set', () => {
      sandbox.spy(File.prototype, 'calculateDestination');

      let instance = new File(filePath);
      assert.equal(instance.calculateDestination.called, false);

      instance.permalink = 'whee';

      assert.ok(instance.calculateDestination.calledOnce);
    });
  });

  describe('render', () => {
    it('TODO', () => {
      assert.ok(true);
    });
  });

  it('has all proper values on its data object', () => {
    let instance = new File(filePath);
    instance.permalink = 'whee';

    assert.deepEqual(instance.data, {
      content: markdown.render(fixture.frontmatterJSON.content),
      excerpt: 'excerpt goes here',
      title: fixture.frontmatterJSON.data.title,
      url: instance.permalink
    });
  });
});
