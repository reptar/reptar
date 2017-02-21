import assert from 'power-assert';
import sinon from 'sinon';
import _ from 'lodash';

import { addTemplateFilter } from '../../../lib/renderer/template';
import { createMarkdownEngine } from '../../../lib/renderer/markdown';
import createPluginApi from '../../../lib/plugin/api';
import PluginEvents from '../../../lib/plugin/events';
import EventHandler from '../../../lib/plugin/event-handler';

describe('plugin/api PluginAPI', () => {
  it('provides a proxy to template.addFilter method', () => {
    const API = createPluginApi({
      addTemplateFilter,
    });

    assert.deepEqual(
      API.template.addFilter,
      addTemplateFilter
    );
  });

  it('allows you to configure markdown engine', () => {
    const mdInstance = createMarkdownEngine();

    const API = createPluginApi({
      getMarkdownEngine: () => mdInstance,
    });

    assert(mdInstance);
    assert(typeof API.markdown.configure === 'function');

    API.markdown.configure((md) => {
      assert.equal(md, mdInstance);
    });
  });

  it('creates methods for registering event handlers', () => {
    const eventHandler = new EventHandler();
    const API = createPluginApi({
      addEventHandler: eventHandler.addEventHandler.bind(eventHandler),
    });

    const beforeSpy = sinon.spy();
    API.event.file.beforeRender(beforeSpy);

    assert(_.isArray(eventHandler._handlers[PluginEvents.file.beforeRender]));
    assert.equal(
      eventHandler._handlers[PluginEvents.file.beforeRender].length,
      1
    );
    assert.deepEqual(
      eventHandler._handlers[PluginEvents.file.beforeRender][0],
      beforeSpy
    );
    assert.equal(beforeSpy.called, false);

    const afterSpy = sinon.spy();
    API.event.file.afterRender(afterSpy);
    API.event.file.afterRender(afterSpy);

    assert(_.isArray(eventHandler._handlers[PluginEvents.file.afterRender]));
    assert.equal(
      eventHandler._handlers[PluginEvents.file.afterRender].length,
      2
    );
    assert.deepEqual(
      eventHandler._handlers[PluginEvents.file.afterRender][0],
      afterSpy
    );
    assert.deepEqual(
      eventHandler._handlers[PluginEvents.file.afterRender][1],
      afterSpy
    );
    assert.equal(afterSpy.called, false);
  });
});
