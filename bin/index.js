#!/usr/bin/env node

var path = require('path');
var logger = require('winston');
logger.cli({
  colorize: true
});
var cliPlugins = require('./plugins');

var yargs = require('yargs');
var argv = yargs
  .command('init', 'scaffold a new yarn site')
  .command('new', 'create new content (post, page, etc.)',
    function (yargs) {
      argv = yargs.option('type', {
        description: 'what type of new content to create',
        default: 'post'
      })
      .help('help')
      .argv;
    }
  )
  .command('build', 'build your site')
  .command('clean', 'cleans destination folder')
  .command('serve', 'serve your site with http-server')
  .command('watch', 'build, serve, and watch for file changes')
  .option('version', {
    alias: 'v',
    description: 'installed version',
    boolean: true
  })
  .help('help')
  .default('help')
  .argv;

// cliPlugins(yargs);
yargs.command('testo', 'ok', function(yargs) {
  console.log('SEWET');
  console.log(yargs.argv);
});
argv = yargs.argv;
console.log(argv);
console.log('yarn\n');

if (argv.version) {
  var packageJson;
  try {
    packageJson = require(path.resolve(__dirname, '../package.json'));
  } catch (e) {
    // If we're working with compiled code the package.json is a directory
    // higher.
    packageJson = require(path.resolve(__dirname, '../../package.json'));
  }

  console.log(packageJson.version);
} else if (argv._.length === 0) {
  yargs.showHelp('log');
  process.exit(0);
} else if (argv._.length === 1) {
  var command = argv._[0];
  var commandPath = path.resolve(__dirname, command);
  try {
    var commandHandler = require(commandPath);
    commandHandler(argv);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      logger.warn('Unknown command: ' + command);
      console.log('');
      yargs.showHelp();
    } else {
      logger.error(e);
    }
  }
} else {
  logger.warn('Unknown command: ' + argv._.join(' '));
  console.log('');
  yargs.showHelp();
}
