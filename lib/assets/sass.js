import sass from 'node-sass';

export default {
  calculateDestination(destination) {
    return destination.replace(/\.s[ac]ss$/, '.css');
  },

  render(file) {
    const { path: filePath } = file;

    return new Promise((resolve, reject) => {
      sass.render(
        {
          file: filePath,
        },
        (e, result) => {
          if (e) {
            reject(e);
            return;
          }

          resolve(result.css);
        }
      );
    });
  },
};
