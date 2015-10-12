import path from 'path';
import logger from 'winston';
import each from 'lodash/collection/each';

const packageJson = 'package.json';

const packageKeys = [
  'dependencies',
  'devDependencies',
  'peerDependencies'
];

/**
 * RegExp used to find yarn packages.
 * @type {RegExp}
 */
export const yarnPackageNameRegex = /^yarn\-/;

/**
 * Looks at a package.json file and retreives all module names that pass our
 * yarnPackageNameRegex, effectively all packages that start with `yarn-`.
 * @param {string} directory Directory to look for a package.json file.
 * @return {Set} Set of package names found.
 */
export function getYarnPackageNames(directory = '') {
  const packagePath = path.join(directory, packageJson);

  let json;
  try {
    json = require(packagePath);
  } catch (e) {
    logger.info(`No ${packageJson} found at ${packagePath}`);
  }

  let moduleNames = new Set();

  if (!json) {
    return moduleNames;
  }

  packageKeys.forEach(packageKey => {
    each(json[packageKey], (version, name) => {
      // Only include a yarn package extension once.
      if (yarnPackageNameRegex.test(name) && !moduleNames.has(name)) {
        moduleNames.add(name);
      }
    });
  });

  return moduleNames;
}