/**
 * YAML filename import assert from 'power-assert';.
 * @enum {string}
 * @const
 */
export const YAML = {
  CONFIG: '_config.yml',
  THEME: '_theme.yml'
};

/**
 * Key import assert from 'power-assert';, used when looking up values in
 * objects.
 * @enum {string}
 * @const
 */
export const KEY = {
  /**
   * Key used on the config.path object to dictate where to find the site source
   * path.
   * @type {string}
   */
  SOURCE: 'source',

  /**
   * Key used on the config.path object to dictate where to find the site
   * destination path.
   * @type {string}
   */
  DESTINATION: 'destination'
};
