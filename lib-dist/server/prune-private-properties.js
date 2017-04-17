'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _reduce2 = require('lodash/reduce');

var _reduce3 = _interopRequireDefault(_reduce2);

exports.default = prunePrivateProperties;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Given an obj it'll prune any properites that start with `_`.
 * @param {Object} obj POJO.
 * @param {Function} isPrivate Function that prunes properties.
 * @return {Object} Pruned object.
 */
function prunePrivateProperties(obj) {
  let isPrivate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : (val, key) => key[0] === '_';

  return (0, _reduce3.default)(obj, (acc, val, key) => {
    if (!isPrivate(val, key)) {
      acc[key] = val;
    }
    return acc;
  }, {});
}