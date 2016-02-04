import path from 'path';
import each from 'lodash/each';

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
 * Looks at a package.json file and retrieves all module names that pass our
 * yarnPackageNameRegex, effectively all packages that start with `yarn-`.
 * @param {string} directory Directory to look for a package.json file.
 * @return {Array} Array of package names found.
 */
export function getYarnPackageNames(directory = '') {
  const packagePath = path.join(directory, packageJson);

  let json;
  try {
    json = require(packagePath);
  } catch (e) { /* swallow */ }

  let moduleNames = [];

  if (!json) {
    return moduleNames;
  }

  packageKeys.forEach(packageKey => {
    each(json[packageKey], (version, name) => {
      // Only include a yarn package extension once.
      if (yarnPackageNameRegex.test(name) && !moduleNames.includes(name)) {
        moduleNames.push(name);
      }
    });
  });

  return moduleNames;
}