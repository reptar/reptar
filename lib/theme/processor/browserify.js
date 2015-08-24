const isUndefined = require('lodash/lang/isUndefined');
const ProcessorBase = require('../processor-base');
const browserify = require('browserify');
const babelify = require('babelify');
const uglifyify = require('uglifyify');

class Browserify extends ProcessorBase {
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

module.exports = Browserify;
