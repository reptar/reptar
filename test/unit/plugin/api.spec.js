import assert from 'power-assert';
import _ from 'lodash';
import sinon from 'sinon';

import {addTemplateFilter} from '../../../lib/template.js';
import Plugin from '../../../lib/plugin/index.js';

const PluginAPI = Plugin.API;

describe('plugin/api PluginAPI', function() {
  beforeEach(() => {
    Plugin._handlers = {};
  });

  it('provides a proxy to template.addFilter method', function() {
    assert.deepEqual(
      PluginAPI.template.addFilter,
      addTemplateFilter
    );
  });

  it('creates methods for registering event handlers', function() {
    const beforeSpy = sinon.spy();
    PluginAPI.event.file.beforeRender(beforeSpy);

    assert(_.isArray(Plugin._handlers[Plugin.Event.file.beforeRender]));
    assert.equal(Plugin._handlers[Plugin.Event.file.beforeRender].length, 1);
    assert.deepEqual(
      Plugin._handlers[Plugin.Event.file.beforeRender][0],
      beforeSpy
    );
    assert.equal(beforeSpy.called, false);

    const afterSpy = sinon.spy();
    PluginAPI.event.file.afterRender(afterSpy);
    PluginAPI.event.file.afterRender(afterSpy);

    assert(_.isArray(Plugin._handlers[Plugin.Event.file.afterRender]));
    assert.equal(Plugin._handlers[Plugin.Event.file.afterRender].length, 2);
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
