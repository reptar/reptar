const assert = require('chai').assert;
const sinon = require('sinon');
const Promise = require('bluebird');

const Plugin = require('../../../lib/plugin/index.js');

describe('plugin/index Plugin', function() {
  let handlerName = 'test:handler';

  afterEach(() => {
    Plugin._handlers = {};
  });

  describe('addEventHandler', function() {
    it('can add handlers', function() {
      let handlerFn = sinon.spy();

      Plugin.addEventHandler(handlerName, handlerFn);

      assert.isArray(Plugin._handlers[handlerName]);
      assert.lengthOf(Plugin._handlers[handlerName], 1);

      assert.deepEqual(
        Plugin._handlers[handlerName][0],
        handlerFn
      );

      assert.equal(handlerFn.called, false);

      Plugin.addEventHandler(handlerName, handlerFn);

      assert.lengthOf(Plugin._handlers[handlerName], 2);
    });
  });

  describe('processEventHandlers', function() {
    it('can invoke handlers when none exist', async () => {
      let eventArg = 'hey man';
      let newVal;
      try {
        newVal = await Plugin.processEventHandlers('bogus', eventArg);
      } catch (e) {
        console.log(e);
      }

      assert.equal(newVal, eventArg);
    });

    it('can invoke handlers sequentionally', async () => {
      let noopFunc = sinon.spy(() => {
        // noop
      });

      let promiseFn = sinon.spy((val) => {
        return new Promise(resolve => {
          resolve(val);
        });
      });

      Plugin.addEventHandler(handlerName, noopFunc);
      Plugin.addEventHandler(handlerName, promiseFn);

      assert.isArray(Plugin._handlers[handlerName]);
      assert.lengthOf(Plugin._handlers[handlerName], 2);

      let handlerValue = 5;
      let newVal;

      try {
        newVal = await Plugin.processEventHandlers(handlerName, handlerValue);
      } catch (e) {
        console.log(e);
      }

      assert.equal(noopFunc.callCount, 1);
      assert.ok(noopFunc.calledWith(5));

      assert.equal(promiseFn.callCount, 1);
      assert.ok(promiseFn.calledWith(5));

      assert.equal(newVal, handlerValue);

      let modifierFn = sinon.spy((val) => {
        return val * val;
      });
      let trailingNoopFn = sinon.spy();

      Plugin.addEventHandler(handlerName, modifierFn);
      Plugin.addEventHandler(handlerName, trailingNoopFn);

      try {
        newVal = await Plugin.processEventHandlers(handlerName, handlerValue);
      } catch (e) {
        throw e;
      }

      assert.equal(noopFunc.callCount, 2);
      assert.equal(promiseFn.callCount, 2);
      assert.equal(modifierFn.callCount, 1);
      assert.ok(modifierFn.calledWith(5));
      assert.equal(trailingNoopFn.callCount, 1);

      assert.equal(newVal, handlerValue * handlerValue);
    });
  });
});
