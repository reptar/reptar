import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import spawn from 'cross-spawn';
import log from '../log';

export default async function init() {
  log.info('Init a new Reptar site');

  const destination = process.cwd();

  const questions = [
    {
      type: 'confirm',
      name: 'destinationOk',
      message: `OK to create new Reptar site at path: ${destination}?`,
      default: true,
    },
  ];

  const answers = await inquirer.prompt(questions);

  if (answers.destinationOk === false) {
    process.exit(1);
  }

  // Create directory.
  try {
    fs.ensureDirSync(destination);
  } catch (e) {
    log.error(`Unable to create folder at ${destination}.`);
    log.error(e);
  }

  const scaffoldPath = path.join(__dirname, '..', '..', 'static', 'scaffold');

  // Copy scaffold files.
  try {
    fs.copySync(scaffoldPath, destination);
  } catch (e) {
    log.error('Unable to create scaffold files.');
    log.error(e);
  }

  function runCmd(cmd, args) {
    return spawn.sync(cmd, args, {
      stdio: 'inherit',
      cwd: destination,
    });
  }

  const npmPackages = [
    'reptar-excerpt',
    'reptar-html-minifier',
    'normalize.css',
  ];

  log.info(`Installing npm packages: ${npmPackages.join(', ')}`);

  runCmd('npm', ['init', '--yes']);

  runCmd('npm', ['install', '--save'].concat(npmPackages));

  log.info(`New Reptar site created at ${destination}`);
  log.info('Now build your site! Run: `reptar build` ');
  log.info('Now see your site! Run: `reptar serve`');
}
