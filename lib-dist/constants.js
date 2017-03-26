'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

const Constants = {
  ConfigFilename: 'reptar.config.js',

  /**
   * Key used on the config.path object to dictate where to find the site source
   * path.
   * @type {string}
   */
  SourceKey: 'source',

  /**
   * Key used on the config.path object to dictate where to find the site
   * destination path.
   * @type {string}
   */
  DestinationKey: 'destination'
};

exports.default = Constants;