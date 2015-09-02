import isUndefined from 'lodash/lang/isUndefined';
import ProcessorBase from '../processor-base';
import browserify from 'browserify';
import babelify from 'babelify';
import uglifyify from 'uglifyify';

export default class Browserify extends ProcessorBase {
  _getFile() {
    let bundle = browserify();
    bundle.add(this.assetSource);

    if (this.plugins) {
      if (!isUndefined(this.plugins.babelify)) {
        bundle = bundle.transform(
          babelify.configure(this.plugins.babelify || {})
        );
      }
      if (!isUndefined(this.plugins.uglifyify)) {
        bundle = bundle.transform(
          uglifyify
        );
      }
    }

    return new Promise((resolve, reject) => {
      bundle.bundle((err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer.toString('utf8'));
        }
      });
    });
  }
}
