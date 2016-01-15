const resolve = require('resolve');
const json = require('../lib/json');
const getYarnPackageNames = json.getYarnPackageNames;

const yarnCliPluginRegex = /^yarn\-cli\-/;

function requirePlugin(id) {
  const packagePath = resolve.sync(id, {basedir: process.cwd()});
  return require(packagePath);
}

function registerCliPlugins(yargs) {
  // All yarn packages that exist in our root package.json file.
  const yarnPackages = getYarnPackageNames(process.cwd());

  yarnPackages.forEach(packageName => {
    if (!yarnCliPluginRegex.test(packageName)) {
      return;
    }

    const plugin = requirePlugin(packageName);

    console.log(plugin(yargs));
  });
}

module.exports = registerCliPlugins;