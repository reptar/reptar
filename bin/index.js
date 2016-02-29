#!/usr/bin/env node

import findUp from 'find-up';
import yargs from 'yargs';
import log from '../lib/log';

import build from './build';
import newFile from './new';
import watch from './watch';
import clean from './clean';
import init from './init';
import serve from './serve';
const commands = {
  build,
  new: newFile,
  watch,
  clean,
  init,
  serve,
};

yargs
  .command('init', 'scaffold a new yarn site')
  .command('new', 'create new content')
  .command('build', 'build your site')
  .command('clean', 'cleans destination folder')
  .command('serve', 'serve your site with http-server')
  .command('watch', 'build, serve, and watch for file changes')
  .option('verbose', {
    description: 'log out additional log information',
    boolean: true
  })
  .option('version', {
    alias: 'v',
    description: 'installed version',
    boolean: true
  })
  .help('help')
  .default('help');

let argv = yargs.argv;

console.log('yarn\n');

if (argv.verbose) {
  log.setLogLevel('verbose');
}

if (argv.version) {
  let packageJson;
  try {
    packageJson = require(findUp.sync('package.json', {
      cwd: __dirname
    }));
  } catch (e) { /* noop */ }

  console.log(packageJson.version);
} else if (argv._.length === 0) {
  yargs.showHelp('log');
  process.exit(0);
} else {
  let command = argv._[0];
  let commandHandler = commands[command];

  if (!commandHandler) {
    log.warn('Unknown command: ' + argv._.join(' '));
    console.log('');
    yargs.showHelp();
  } else {
    commandHandler(argv);
  }
}