'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _crossSpawn = require('cross-spawn');

var _crossSpawn2 = _interopRequireDefault(_crossSpawn);

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* () {
    _log2.default.info('Init a new Reptar site');

    const destination = process.cwd();

    const questions = [{
      type: 'confirm',
      name: 'destinationOk',
      message: `OK to create new Reptar site at path: ${destination}?`,
      default: true
    }];

    const answers = yield _inquirer2.default.prompt(questions);

    if (answers.destinationOk === false) {
      process.exit(1);
    }

    // Create directory.
    try {
      _fsExtra2.default.ensureDirSync(destination);
    } catch (e) {
      _log2.default.error(`Unable to create folder at ${destination}.`);
      _log2.default.error(e);
    }

    const scaffoldPath = _path2.default.join(__dirname, '..', '..', 'static', 'scaffold');

    // Copy scaffold files.
    try {
      _fsExtra2.default.copySync(scaffoldPath, destination);
    } catch (e) {
      _log2.default.error('Unable to create scaffold files.');
      _log2.default.error(e);
    }

    function runCmd(cmd, args) {
      return _crossSpawn2.default.sync(cmd, args, {
        stdio: 'inherit',
        cwd: destination
      });
    }

    const npmPackages = ['reptar-excerpt', 'reptar-html-minifier', 'normalize.css'];

    _log2.default.info(`Installing npm packages: ${npmPackages.join(', ')}`);

    runCmd('npm', ['init', '--yes']);

    runCmd('npm', ['install', '--save'].concat(npmPackages));

    _log2.default.info(`New Reptar site created at ${destination}`);
    _log2.default.info('Now build your site! Run: `reptar build` ');
    _log2.default.info('Now see your site! Run: `reptar serve`');
  });

  function init() {
    return _ref.apply(this, arguments);
  }

  return init;
})();