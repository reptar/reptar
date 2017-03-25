#!/usr/bin/env node

const path = require('path');
const findUp = require('find-up');
const yargs = require('yargs');

yargs
  .command('init', 'scaffold a new site')
  .command('new', 'create new content')
  .command('build', 'build your site', commandYargs => (
    commandYargs.option('clean', {
      alias: 'c',
      default: false,
    })
  ))
  .command('clean', 'clean destination folder')
  .command('serve', 'create a simple web server')
  .command('watch', 'create a server that builds your site lazily')
  .option('incremental', {
    description: 'only build files that have changed',
    boolean: true,
    default: true,
  })
  .option('version', {
    alias: 'v',
    description: 'installed version',
    boolean: true,
  })
  .help('help')
  .default('help');

module.exports = function reptarCli({ log, libPath }) {
  const argv = yargs.argv;

  process.stdout.write('reptar\n\n');

  if (argv.version) {
    let packageJson;
    try {
      // eslint-disable-next-line
      packageJson = require(findUp.sync('package.json', {
        cwd: __dirname,
      }));
    } catch (e) { /* noop */ }

    process.stdout.write(packageJson.version);
    process.stdout.write('\n');
  } else if (argv._.length === 0) {
    yargs.showHelp('log');
    process.exit(0);
  } else {
    const command = argv._[0];
    const commandPath = path.join(libPath, 'cli', command);
    let commandHandler;

    try {
      commandHandler = require(commandPath).default; // eslint-disable-line
    } catch (e) {
      log.error(`Unknown command: ${argv._.join(' ')}`);
      process.stdout.write('\n');
      yargs.showHelp();
    }

    commandHandler(argv)
      .catch((e) => {
        log.error(e.message);
        process.exit(1);
      });
  }
};
