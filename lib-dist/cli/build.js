'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (options) {
    const id = _log2.default.startActivity('building\t\t\t\t');
    process.stdout.write('\n');

    const reptar = new _index2.default(options);
    yield reptar.update();
    yield reptar.build();

    process.stdout.write('\n');
    _log2.default.endActivity(id);

    process.exit(0);
  });

  function build(_x) {
    return _ref.apply(this, arguments);
  }

  return build;
})();