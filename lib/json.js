import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';

const packageJson = 'package.json';

const packageKeys = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
];

/**
 * RegExp used to find Reptar packages.
 * @type {RegExp}
 */
export const packageNameRegex = /^reptar-/;

/**
 * Looks at a package.json file and retrieves all module names that pass our
 * packageNameRegex, effectively all packages that start with `reptar-`.
 * @param {string} directory Directory to look for a package.json file.
 * @return {Array} Array of package names found.
 */
export function getReptarPackageNames(directory = '') {
  const packagePath = path.join(directory, packageJson);

  let json;
  try {
    json = fs.readJsonSync(packagePath);
  } catch (e) { /* swallow */ }

  const moduleNames = [];

  if (!json) {
    return moduleNames;
  }

  packageKeys.forEach((packageKey) => {
    _.each(json[packageKey], (version, name) => {
      // Only include a Reptar package extension once.
      if (packageNameRegex.test(name) && !moduleNames.includes(name)) {
        moduleNames.push(name);
      }
    });
  });

  return moduleNames;
}
