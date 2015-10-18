#!/usr/bin/env node

var path = require('path');
var logger = require('winston');
logger.cli({
  colorize: true
});

require('babel/polyfill');

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
  .help('help')
  .default('help')
  .argv;

console.log('yarn\n');

if (argv._.length === 0) {
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
