import glob from 'glob';
import _ from 'lodash';

import Url from '../url';
import { packageNameRegex, getReptarPackageNames } from '../json';
import { addTemplateFilter } from '../template';
import EventHandler from './event-handler';
import createPluginApi from './api';

export default class PluginManager {
  constructor({ config } = {}) {
    /**
     * @type {Config}
     * @private
     */
    this._config = config;
  }

  update({ theme, getMarkdownEngine }) {
    const eventHandler = new EventHandler();
    this.eventHandler = eventHandler;

    this.pluginApi = createPluginApi({
      addEventHandler: eventHandler.addEventHandler.bind(eventHandler),
      addTemplateFilter,
      getMarkdownEngine,
    });

    // Built-in plugins.
    this.loadFromPackageJson(
      Url.pathFromRoot('./'),
      this._config.get('plugins')
    );

    [
      theme.config.path.plugins, // Active theme plug-ins
      this._config.get('path.plugins'), // Site plug-ins
    ].forEach(this.loadFromDirectory, this);
  }

  loadFromPackageJson(directory = '', pluginConfigs) {
    getReptarPackageNames(directory).forEach((name) => {
      const configName = name.replace(packageNameRegex, '');
      const pluginConfig = pluginConfigs[configName];

      if (_.get(pluginConfig, 'enabled')) {
        this.loadPlugin(name, pluginConfig.options);
      }
    });
  }

  /**
   * Load all .js files from a directory and load them as a plugin.
   * @param {string} directory Path to directory where plugin files exist.
   */
  loadFromDirectory(directory = '') {
    const filePaths = glob.sync(`${directory}/**/*.js`, {
      nodir: true,
    });

    if (!filePaths.length) {
      return;
    }

    filePaths.forEach(this.loadPlugin, this);
  }

  /**
   * Using node's require function, load a plugin and invoke it, passing it
   * the API object and any other additional objects defined from the
   * _config.yml file.
   * @param {string} pluginPath Path to the plugin module.
   * @param {object} options Plugin options.
   */
  loadPlugin(pluginPath = '', options = {}) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(pluginPath)(this.pluginApi, options);
  }
}
