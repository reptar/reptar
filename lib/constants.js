/**
 * YAML filename constants.
 * @enum {string}
 * @const
 */
exports.YAML = {
  CONFIG: '_config.yml',
  THEME: '_theme.yml'
};

/**
 * Key constants, used when looking up values in objects.
 * @enum {string}
 * @const
 */
exports.KEY = {
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
