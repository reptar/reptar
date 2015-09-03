import {assert} from 'chai';
import sinon from 'sinon';

import * as template from '../../../lib/render/template.js';
import Plugin from '../../../lib/plugin/index.js';

const PluginAPI = Plugin.API;

describe('plugin/api PluginAPI', function() {
  beforeEach(() => {
    Plugin._handlers = {};
  });

  it('provides a proxy to template.addFilter method', function() {
    assert.deepEqual(
      PluginAPI.template.addFilter,
      template.addFilter
    );
  });

  it('creates methods for registering event handlers', function() {
    let beforeSpy = sinon.spy();
    PluginAPI.event.file.beforeRender(beforeSpy);

    assert.isArray(Plugin._handlers[Plugin.Event.file.beforeRender]);
    assert.lengthOf(Plugin._handlers[Plugin.Event.file.beforeRender], 1);
    assert.deepEqual(
      Plugin._handlers[Plugin.Event.file.beforeRender][0],
      beforeSpy
    );
    assert.equal(beforeSpy.called, false);

    let afterSpy = sinon.spy();
    PluginAPI.event.file.afterRender(afterSpy);
    PluginAPI.event.file.afterRender(afterSpy);

    assert.isArray(Plugin._handlers[Plugin.Event.file.afterRender]);
    assert.lengthOf(Plugin._handlers[Plugin.Event.file.afterRender], 2);
    assert.deepEqual(
      Plugin._handlers[Plugin.Event.file.afterRender][0],
      afterSpy
    );
    assert.deepEqual(
      Plugin._handlers[Plugin.Event.file.afterRender][1],
      afterSpy
    );
    assert.equal(afterSpy.called, false);
  });
});