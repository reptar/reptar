import browserify from 'browserify';
import babelify from 'babelify';
import uglifyify from 'uglifyify';

export default {
  calculateDestination(destination) {
    return destination;
  },

  write(file) {
    const { path: filePath } = file;

    const bundle = browserify();
    bundle.add(filePath);

    bundle.transform(
      babelify.configure({
        presets: [
          [require.resolve('babel-preset-env'), {
            targets: {
              browsers: ['last 2 versions'],
            },
            uglify: true,
          }],
        ],
      })
    );

    bundle.transform(
      uglifyify
    );

    return new Promise((resolve, reject) => {
      bundle.bundle((err, buffer) => {
        if (err) {
          const e = new Error(
            `Unable to browserify ${filePath}.\n${err}`
          );
          e.stack = err.stack;
          reject(e);
        } else {
          resolve(buffer.toString('utf8'));
        }
      });
    });
  },
};
