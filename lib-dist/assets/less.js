'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _less = require('less');

var _less2 = _interopRequireDefault(_less);

var _lessPluginAutoprefix = require('less-plugin-autoprefix');

var _lessPluginAutoprefix2 = _interopRequireDefault(_lessPluginAutoprefix);

var _lessPluginCleanCss = require('less-plugin-clean-css');

var _lessPluginCleanCss2 = _interopRequireDefault(_lessPluginCleanCss);

var _lessPluginNpmImport = require('less-plugin-npm-import');

var _lessPluginNpmImport2 = _interopRequireDefault(_lessPluginNpmImport);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  calculateDestination(destination) {
    return destination.replace(/\.less$/, '.css');
  },

  render(file) {
    const filePath = file.path;

    // Derive source path from the input source file.

    const sourcePath = _path2.default.dirname(filePath);

    const lessPlugins = [new _lessPluginNpmImport2.default({
      basedir: sourcePath
    }), new _lessPluginAutoprefix2.default({
      browsers: ['last 2 versions']
    }), new _lessPluginCleanCss2.default()];

    const rawAsset = _fsExtra2.default.readFileSync(filePath, 'utf8');

    return new _promise2.default((resolve, reject) => {
      _less2.default.render(rawAsset, {
        // Specify search paths for @import directives.
        paths: [sourcePath],
        plugins: lessPlugins
      }, (e, output) => {
        if (e) {
          reject(e);
          return;
        }

        resolve(output.css);
      });
    });
  }
};