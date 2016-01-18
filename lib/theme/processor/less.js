import isUndefined from 'lodash/isUndefined';
import fs from 'fs-extra';
import ProcessorBase from '../processor-base';
import less from 'less';
import LessPluginAutoPrefix from 'less-plugin-autoprefix';
import LessPluginCleanCSS from 'less-plugin-clean-css';
import LessPluginNpmImport from 'less-plugin-npm-import';

export default class Less extends ProcessorBase {
  _getFile() {
    // Derive source path from the input source file.
    let sourcePath = this.assetSource.split('/').slice(0, -1).join('/');

    let lessPlugins = [];

    // Add built-in plugins.
    lessPlugins.push(
      new LessPluginNpmImport({
        basedir: sourcePath
      })
    );

    if (this.plugins) {
      if (!isUndefined(this.plugins.autoprefixer)) {
        lessPlugins.push(
          new LessPluginAutoPrefix(this.plugins.autoprefixer || {})
        );
      }
      if (!isUndefined(this.plugins['clean-css'])) {
        lessPlugins.push(
          new LessPluginCleanCSS(this.plugins['clean-css'] || {})
        );
      }
    }

    let rawAsset = fs.readFileSync(this.assetSource, 'utf8');

    return new Promise((resolve, reject) => {
      less.render(rawAsset, {
        // Specify search paths for @import directives.
        paths: [sourcePath],
        plugins: lessPlugins
      }, (e, output) => {
        if (e) {
          return reject(e);
        }

        resolve(output.css);
      });
    });
  }

  _getDestination() {
    let destination = this.assetDestination.replace(
      /\.less$/,
      '.css'
    );

    return destination;
  }
}
