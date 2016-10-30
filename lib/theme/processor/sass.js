import sass from 'node-sass';
import ProcessorBase from '../processor-base';

export default class Sass extends ProcessorBase {
  _getFile() {
    return new Promise((resolve, reject) => {
      sass.render({
        file: this.assetSource,
      }, (e, result) => {
        if (e) {
          reject(e);
          return;
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
