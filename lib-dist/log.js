'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _activityLogger = require('activity-logger');

var _activityLogger2 = _interopRequireDefault(_activityLogger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-console */
let verboseMode = true;
let isSilent = false;

exports.default = {
  setLogLevel(logLevel) {
    verboseMode = logLevel === 'verbose';
  },

  setSilent() {
    let newSilent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    isSilent = newSilent;
  },

  info() {
    var _console;

    const prefix = `${_chalk2.default.green('info')}:\t`;

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    args.unshift(prefix);
    (_console = console).log.apply(_console, args);
  },

  warn() {
    var _console2;

    if (!verboseMode) {
      return;
    }
    const prefix = `${_chalk2.default.yellow('warn')}:\t`;

    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    args.unshift(prefix);
    (_console2 = console).log.apply(_console2, args);
  },

  error() {
    var _console3;

    const prefix = `${_chalk2.default.red('error')}:\t`;

    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    args.unshift(prefix);
    (_console3 = console).log.apply(_console3, args);
  },

  startActivity(name) {
    if (isSilent) {
      return -1;
    }
    return _activityLogger2.default.start(name);
  },

  endActivity(id) {
    if (isSilent) {
      return true;
    }
    return _activityLogger2.default.end(id);
  }
};