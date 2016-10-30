import crypto from 'crypto';

/**
 * Create checksum hash of input.
 * @example
 *   '50de70409f11f87b430f248daaa94d67'
 * @param {string} input Input to hash.
 * @return {string}
 */
export default function createChecksum(input) {
  return crypto.createHash('md5').update(input, 'utf8').digest('hex');
}
