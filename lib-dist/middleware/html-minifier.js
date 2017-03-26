'use strict';

/* eslint-disable */
const minify = require('html-minifier').minify;
const glob = require('glob');
const fse = require('fs-extra');

function minifyFile(filePath) {
  const fileContent = fse.readFileSync(filePath, 'utf8');

  const newContent = minify(fileContent, {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    removeAttributeQuotes: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeRedundantAttributes: true
  });

  fse.outputFileSync(filePath, newContent, 'utf8');
}

module.exports = function () {
  glob('_site/**/*.html', {
    // Do not match directories, only files.
    nodir: true
  }, (err, filePaths) => {
    filePaths.map(minifyFile);
  });
};