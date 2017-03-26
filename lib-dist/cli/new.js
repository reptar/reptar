'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _isNil2 = require('lodash/isNil');

var _isNil3 = _interopRequireDefault(_isNil2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _url = require('../url');

var _url2 = _interopRequireDefault(_url);

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const newTypes = {
  file: {
    prompts: [{
      name: 'title',
      type: 'input',
      message: 'Title of new file.',
      validate: input => !(0, _isNil3.default)(input)
    }],
    template: data => `---
title: ${data.title}
date: ${data.date}
---
`
  }
};

exports.default = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (args) {
    const newTypeKey = args._[1];
    const newType = newTypes[newTypeKey];
    if ((0, _isNil3.default)(newType)) {
      _log2.default.error(`Unknown type: '${newTypeKey}'.`);
      _log2.default.error(`Types supported: ${(0, _keys2.default)(newTypes).join(',')}`);
      _log2.default.error('Use via: reptar new <type>');
      process.exit(0);
    }

    _log2.default.info(`Create new "${newTypeKey}"`);

    const config = new _config2.default();
    config.update();

    const data = yield _inquirer2.default.prompt(newType.prompts);

    // Set date to now.
    data.date = (0, _moment2.default)().format('YYYY-MM-DD');

    const filePath = _url2.default.interpolatePermalink(config.get('newFilePermalink'), data).toLowerCase();
    const fileContent = newType.template(data);
    const absolutePath = _path2.default.join(config.get('path.source'), filePath);

    // Write file!
    _fsExtra2.default.outputFileSync(absolutePath, fileContent, 'utf8');

    _log2.default.info(`New ${newTypeKey} created at ${absolutePath}`);
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})();