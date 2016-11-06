import glob from 'glob';
import _ from 'lodash';

import { packageNameRegex, getReptarPackageNames } from '../json';
import EventHandler from './event-handler';
import createPluginApi from './api';

class Plugin {
  static loadFromPackageJson(directory = '', pluginConfigs) {
    getReptarPackageNames(directory).forEach((name) => {
      const configName = name.replace(packageNameRegex, '');
      const pluginConfig = pluginConfigs[configName];

      if (_.get(pluginConfig, 'enabled')) {
        Plugin.loadPlugin(name, pluginConfig.options);
      }
    });
  }

  /**
   * Load all .js files from a directory and load them as a plugin.
   * @param {string} directory Path to directory where plugin files exist.
   */
  static loadFromDirectory(directory = '') {
    const filePaths = glob.sync(`${directory}/**/*.js`, {
      nodir: true,
    });

    if (!filePaths.length) {
      return;
    }

    filePaths.forEach(Plugin.loadPlugin);
  }

  /**
   * Using node's require function, load a plugin and invoke it, passing it
   * the API object and any other additional objects defined from the
   * _config.yml file.
   * @param {string} pluginPath Path to the plugin module.
   * @param {object} options Plugin options.
   */
  static loadPlugin(pluginPath = '', options = {}) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(pluginPath)(Plugin.API, options);
  }
}

const eventHandler = new EventHandler();
Plugin.eventHandler = eventHandler;

Plugin.API = createPluginApi({
  addEventHandler: eventHandler.addEventHandler.bind(eventHandler),
});

export default Plugin;
