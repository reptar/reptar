import assert from 'power-assert';
import sinon from 'sinon';
import _ from 'lodash';
import Promise from 'bluebird';
import EventHandler from '../../../lib/plugin/event-handler';

describe('plugin/event-handler EventHandler', () => {
  const handlerName = 'test:handler';
  let instance;

  beforeEach(() => {
    instance = new EventHandler();
  });

  describe('addEventHandler', () => {
    it('can add handlers', () => {
      const handlerFn = sinon.spy();

      instance.addEventHandler(handlerName, handlerFn);

      assert(_.isArray(instance._handlers[handlerName]));
      assert.equal(instance._handlers[handlerName].length, 1);

      assert.deepEqual(
        instance._handlers[handlerName][0],
        handlerFn
      );

      assert.equal(handlerFn.called, false);

      instance.addEventHandler(handlerName, handlerFn);

      assert.equal(instance._handlers[handlerName].length, 2);
    });
  });

  describe('processEventHandlers', () => {
    describe('can invoke handlers when none exist', () => {
      it('with one passed argument', async () => {
        const eventArg = 'hey man';
        let newVal;
        try {
          newVal = await instance.processEventHandlers('bogus', eventArg);
        } catch (e) {
          // noop
        }

        assert.deepEqual(newVal, eventArg);
      });

      it('with multiple passed arguments', async () => {
        const eventArgs = [
          'the chicken',
          'is',
          5,
        ];

        let newVal;
        try {
          newVal = await instance.processEventHandlers(
            'bogus',
            eventArgs[0],
            eventArgs[1],
            eventArgs[2]
          );
        } catch (e) {
          // noop
        }

        assert.deepEqual(newVal, eventArgs);
      });
    });

    it('can invoke handlers sequentionally', async () => {
      const noopFunc = sinon.spy(() => {
        // noop
      });

      const promiseFn = sinon.spy(val =>
        new Promise((resolve) => {
          resolve(val);
        })
      );

      instance.addEventHandler(handlerName, noopFunc);
      instance.addEventHandler(handlerName, promiseFn);

      assert(_.isArray(instance._handlers[handlerName]));
      assert.equal(instance._handlers[handlerName].length, 2);

      const handlerValue = 5;
      let newVal;

      try {
        newVal = await instance.processEventHandlers(handlerName, handlerValue);
      } catch (e) {
        throw e;
      }

      assert.equal(noopFunc.callCount, 1);
      assert.ok(noopFunc.calledWith(5));

      assert.equal(promiseFn.callCount, 1);
      assert.ok(promiseFn.calledWith(5));

      assert.equal(newVal, handlerValue);

      const modifierFn = sinon.spy(val => val * val);
      const trailingNoopFn = sinon.spy();

      instance.addEventHandler(handlerName, modifierFn);
      instance.addEventHandler(handlerName, trailingNoopFn);

      try {
        newVal = await instance.processEventHandlers(handlerName, handlerValue);
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

    it('invokes handlers with multiple arguments', async () => {
      const blankReturnFn = sinon.spy(() => { // eslint-disable-line
        return;
      });

      instance.addEventHandler(handlerName, blankReturnFn);

      assert(_.isArray(instance._handlers[handlerName]));
      assert.equal(instance._handlers[handlerName].length, 1);

      const argValue1 = { foo: 'bar' };
      const argValue2 = 'a wonderful world';
      let processedEventValue;

      try {
        processedEventValue = await instance.processEventHandlers(
          handlerName,
          argValue1,
          argValue2
        );
      } catch (e) {
        // noop
      }

      assert.equal(blankReturnFn.callCount, 1);
      assert.ok(blankReturnFn.calledWith(argValue1, argValue2));

      assert.equal(argValue1, processedEventValue[0]);
      assert.equal(argValue2, processedEventValue[1]);
    });

    describe('throws when plugin handlers', () => {
      it('return only part of the arguments given', (done) => {
        const eventHandlerFn = sinon.spy((arg1, arg2) => arg2);

        instance.addEventHandler(handlerName, eventHandlerFn);

        assert(_.isArray(instance._handlers[handlerName]));
        assert.equal(instance._handlers[handlerName].length, 1);

        const argValue1 = { foo: 'bar' };
        const argValue2 = 'a wonderful world';

        instance.processEventHandlers(
          handlerName,
          argValue1,
          argValue2
        ).catch(() => {
          done();
        });
      });

      it('returns arguments in wrong order given', (done) => {
        const eventHandlerFn = sinon.spy((arg1, arg2) => [arg2, arg1]);

        instance.addEventHandler(handlerName, eventHandlerFn);

        assert(_.isArray(instance._handlers[handlerName]));
        assert.equal(instance._handlers[handlerName].length, 1);

        const argValue1 = { foo: 'bar' };
        const argValue2 = 'a wonderful world';

        instance.processEventHandlers(
          handlerName,
          argValue1,
          argValue2
        ).catch(() => {
          done();
        });
      });
    });
  });
});
