import ProcessorBase from '../processor-base';
import sass from 'node-sass';

export default class Sass extends ProcessorBase {
  _getFile() {
    return new Promise((resolve, reject) => {
      sass.render({
        file: this.assetSource
      }, (e, result) => {
        if (e) {
          return reject(e);
        }

        resolve(result.css);
      });
    });
  }

  _getDestination() {
    const destination = this.assetDestination.replace(
      /\.s[ac]ss$/,
      '.css'
    );

    return destination;
  }
}
