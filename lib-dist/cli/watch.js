'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _activityLogger = require('activity-logger');

var _activityLogger2 = _interopRequireDefault(_activityLogger);

var _browserSync = require('browser-sync');

var _server = require('../server/server');

var _server2 = _interopRequireDefault(_server);

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* () {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    const startActivity = _activityLogger2.default.start('Starting watch.\t\t\t\t');

    const reptar = new _index2.default((0, _extends3.default)({
      // Turn off caching of templates.
      noTemplateCache: true,
      showSpinner: false
    }, options));

    yield reptar.update();

    const server = new _server2.default(reptar);
    yield server.start();

    _activityLogger2.default.end(startActivity);

    process.stdout.write('\n');
    _log2.default.info('Server running at:', server.server.info.uri);

    if (options.browserSync) {
      const browserSync = (0, _browserSync.create)();
      browserSync.init({
        files: `${reptar.config.get('path.source')}/**/*`,
        proxy: server.server.info.uri
      });
    }
  });

  function watch() {
    return _ref.apply(this, arguments);
  }

  return watch;
})();