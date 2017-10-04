'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _hapi = require('hapi');

var _hapi2 = _interopRequireDefault(_hapi);

var _inert = require('inert');

var _inert2 = _interopRequireDefault(_inert);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* () {
    const config = new _config2.default();
    config.update();

    const server = new _hapi2.default.Server({
      connections: {
        routes: {
          files: {
            relativeTo: config.get('path.destination')
          }
        }
      }
    });

    server.connection({
      host: config.get('server.host'),
      port: config.get('server.port')
    });

    yield server.register([_inert2.default]);

    server.route({
      method: 'GET',
      path: _path2.default.posix.join('/', config.get('server.baseurl'), '/{param*}'),
      handler: {
        directory: {
          path: '.',
          redirectToSlash: true,
          index: true
        }
      }
    });

    server.start();

    _log2.default.info('Server running at:', _path2.default.join(server.info.uri, config.get('server.baseurl')));
  });

  function serve() {
    return _ref.apply(this, arguments);
  }

  return serve;
})();