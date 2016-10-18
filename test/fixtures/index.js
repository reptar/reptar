import _ from 'lodash';
import mockFs from 'mock-fs';
import fs from 'fs-extra';
import path from 'path';
import {
  getReptarPackageNames,
} from '../../lib/json.js';

/**
 * Recursively walk a directory and return all File paths found inside.
 * @param {string} directory Absolute directory path.
 * @return {Array.<string>}
 */
function getAllFilePaths(directory) {
  let filePaths = [];

  return new Promise((resolve) => {
    fs.walk(directory)
      .on('data', function(item) {
        if (item.stats.isFile()) {
          filePaths.push(item.path);
        }
      })
      .on('end', function() {
        resolve(filePaths);
      });
  });
}

export function restoreMockFs() {
  return mockFs.restore();
}

/**
 * Given an array of paths, load the file contents as the value.
 * @param {Array.<string>} paths Array of strings relative to this file.
 * @param {Object} options Additional options.
 * @param {Function} options.mapKey Can provide a function to map the key in
 *   the returned object.
 * @return {Object.<string,string>} Mapping of paths to contents.
 */
function mirrorPathsToContent(paths, options = {}) {
  const mapKey = options.mapKey || ((x) => x);

  return paths.reduce((result, fullPath) => {
    result[mapKey(fullPath)] = fs.readFileSync(fullPath, 'utf8');
    return result;
  }, {});
}

/**
 * Mock files that Reptar directly depends on.
 * @return {Object}
 */
function coreReptarFiles() {
  return mirrorPathsToContent([
    '.babelrc',
    'package.json',
  ].map(p => path.resolve(__dirname, '../../', p)));
}

/**
 * Get all needed node_module file paths of npm modules we need to mock.
 * @return {Array.<string>} [description]
 */
async function reptarNpmFilePaths() {
  const reptarRootPath = path.join(__dirname, '../../');
  let npmModules = getReptarPackageNames(reptarRootPath);

  let allPaths = [];
  for (let i = 0; i < npmModules.length; i++) {
    const modulePaths = await getAllFilePaths(path.join(
      reptarRootPath,
      'node_modules',
      npmModules[i]
    ));
    allPaths = allPaths.concat(modulePaths);
  }

  return allPaths;
}

/**
 * Mock a simple Reptar site.
 * @return {Object}
 */
export async function mockSimpleSite() {
  const filePaths = await getAllFilePaths(path.join(__dirname, 'simple'));
  const mocks = mirrorPathsToContent(filePaths, {
    mapKey: (currentPath) => {
      return currentPath.replace(`${__dirname}/`, '');
    }
  });

  const themePaths = await getAllFilePaths(path.join(__dirname, 'themes/one'));
  const themeOne = mirrorPathsToContent(themePaths, {
    mapKey: (currentPath) => {
      return currentPath.replace(
        path.join(__dirname, 'themes/one'),
        'simple/_themes/one'
      );
    }
  });

  const npmPaths = await reptarNpmFilePaths();
  const npmMocks = mirrorPathsToContent(npmPaths, {
    msapKey: (currentPath) => {
      return currentPath.replace(
        /(.*)node_modules/,
        'node_modules'
      );
    }
  });

  const allMocks = {
    ...mocks,
    ...themeOne,
    ...coreReptarFiles(),
    ...npmMocks,
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

/**
 * Get all the expected output for the simple blog with the 'one' theme.
 * The keys are written relatively.
 * @return {Object.<string,string>}
 */
export async function getSimpleOneOutput() {
  const simpleOneOutputDir = path.join(__dirname, 'output/simple-one/');
  const filePaths = await getAllFilePaths(simpleOneOutputDir);
  const simpleOne = mirrorPathsToContent(filePaths, {
    mapKey: (currentPath) => {
      return currentPath.replace(
        simpleOneOutputDir,
        ''
      );
    }
  });
  return simpleOne;
}

/**
 * Given an object with file paths as keys and the file contents as the value
 * this will return a new object that only contains file paths that are files,
 * i.e. they end in '.json' or '.html'.
 * @param {Object.<string,string>} files Files.
 * @return {Object.<string,string>}
 */
export function filterOnlyFiles(files) {
  return _.reduce(files, (result, fileContent, filePath) => {
    if (filePath.match(/\.(html)/)) {
      result[filePath] = fileContent;
    }
    return result;
  }, {});
}
