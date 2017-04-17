'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _browserify = require('browserify');

var _browserify2 = _interopRequireDefault(_browserify);

var _babelify = require('babelify');

var _babelify2 = _interopRequireDefault(_babelify);

var _uglifyify = require('uglifyify');

var _uglifyify2 = _interopRequireDefault(_uglifyify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  calculateDestination(destination) {
    return destination;
  },

  render(file) {
    const filePath = file.path;


    const bundle = (0, _browserify2.default)();
    bundle.add(filePath);

    bundle.transform(_babelify2.default.configure({
      presets: [[require.resolve('babel-preset-env'), {
        targets: {
          browsers: ['last 2 versions']
        },
        uglify: true
      }]]
    }));

    bundle.transform(_uglifyify2.default);

    return new _promise2.default((resolve, reject) => {
      bundle.bundle((err, buffer) => {
        if (err) {
          const e = new Error(`Unable to browserify ${filePath}.\n${err}`);
          e.stack = err.stack;
          reject(e);
        } else {
          resolve(buffer.toString('utf8'));
        }
      });
    });
  }
};