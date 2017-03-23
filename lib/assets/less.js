import path from 'path';
import fs from 'fs-extra';
import less from 'less';
import LessPluginAutoPrefix from 'less-plugin-autoprefix';
import LessPluginCleanCSS from 'less-plugin-clean-css';
import LessPluginNpmImport from 'less-plugin-npm-import';

export default {
  calculateDestination(destination) {
    return destination.replace(
      /\.less$/,
      '.css'
    );
  },

  write(file) {
    const { path: filePath } = file;

    // Derive source path from the input source file.
    const sourcePath = path.dirname(filePath);

    const lessPlugins = [
      new LessPluginNpmImport({
        basedir: sourcePath,
      }),
      new LessPluginAutoPrefix({
        browsers: ['last 2 versions'],
      }),
      new LessPluginCleanCSS(),
    ];

    const rawAsset = fs.readFileSync(filePath, 'utf8');

    return new Promise((resolve, reject) => {
      less.render(rawAsset, {
        // Specify search paths for @import directives.
        paths: [sourcePath],
        plugins: lessPlugins,
      }, (e, output) => {
        if (e) {
          reject(e);
          return;
        }

        resolve(output.css);
      });
    });
  },
};
