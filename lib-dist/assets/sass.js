'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _nodeSass = require('node-sass');

var _nodeSass2 = _interopRequireDefault(_nodeSass);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  calculateDestination(destination) {
    return destination.replace(/\.s[ac]ss$/, '.css');
  },

  render(file) {
    const filePath = file.path;


    return new _promise2.default((resolve, reject) => {
      _nodeSass2.default.render({
        file: filePath
      }, (e, result) => {
        if (e) {
          reject(e);
          return;
        }

        resolve(result.css);
      });
    });
  }
};