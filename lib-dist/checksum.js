'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createChecksum;

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create checksum hash of input.
 * @example
 *   '50de70409f11f87b430f248daaa94d67'
 * @param {string} input Input to hash.
 * @return {string}
 */
function createChecksum(input) {
  return _crypto2.default.createHash('md5').update(input, 'utf8').digest('hex');
}