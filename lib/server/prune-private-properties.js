import _ from 'lodash';

/**
 * Given an obj it'll prune any properites that start with `_`.
 * @param {Object} obj POJO.
 * @param {Function} isPrivate Function that prunes properties.
 * @return {Object} Pruned object.
 */
export default function prunePrivateProperties(
  obj,
  isPrivate = (val, key) => key[0] === '_'
) {
  return _.reduce(obj, (acc, val, key) => {
    if (!isPrivate(val, key)) {
      acc[key] = val;
    }
    return acc;
  }, {});
}
