import mockFs from 'mock-fs';
import fs from 'fs';
import path from 'path';

export function restoreMockFs() {
  return mockFs.restore();
}

/**
 * Given an array of paths, load the file contents as the value.
 * @param {Array.<string>} paths Array of strings relative to this file.
 * @param {Object} options Additional options.
 * @param {Function} options.mapKey Can provide a function to map the key in
 *   the returned object.
 * @param {string} optoins.rootDir Where we should resolve files from.
 * @return {Object.<string,string>} Mapping of paths to contents.
 */
function mirrorPathsToContent(paths, options = {}) {
  const mapKey = options.mapKey || ((x) => x);
  const rootDir = options.rootDir || __dirname;

  return paths.reduce((result, currentPath) => {
    const fullPath = path.resolve(rootDir, currentPath);
    result[mapKey(currentPath)] = fs.readFileSync(fullPath, 'utf8');
    return result;
  }, {});
}

/**
 * Mock files that Yarn directly depends on.
 * @return {Object}
 */
function coreYarnFiles() {
  return mirrorPathsToContent([
    'lib/config/defaults.yml',
    '.babelrc',
  ], {
    rootDir: path.resolve(__dirname, '../../')
  });
}

/**
 * Mock a simple Yarn site.
 * @return {Object}
 */
export function mockSimpleSite() {
  const mocks = mirrorPathsToContent([
    'simple/_config.yml',
    'simple/package.json',
    'simple/about.md',
    'simple/_posts/my-first-yarn.md',
  ]);

  const themeOne = mirrorPathsToContent([
    'themes/one/_theme.yml',
    'themes/one/package.json',
    'themes/one/css/main.less',
    'themes/one/js/main.js',
    'themes/one/templates/_loop.html',
    'themes/one/templates/base.html',
    'themes/one/templates/page.html',
    'themes/one/templates/tag.html',
    'themes/one/templates/_pagination.html',
    'themes/one/templates/index.html',
    'themes/one/templates/post.html',
  ], {
    mapKey: (currentPath) => {
      return currentPath.replace('themes/one', 'simple/_themes/one');
    }
  });

  const allMocks = {
    ...mocks,
    ...themeOne,
    ...coreYarnFiles(),
  };

  mockFs(allMocks);

  return allMocks;
}

/**
 * Return the path to the simple mocked site.
 * @return {string}
 */
export function getPathToSimpleMock() {
  return 'simple';
}
