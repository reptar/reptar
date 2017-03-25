import fs from 'fs-extra';
import moment from 'moment';
import path from 'path';
import inquirer from 'inquirer';
import spawn from 'cross-spawn';
import log from '../log';
import Constants from '../constants';

const dateNowFormatted = moment().format('YYYY-M-D');

/* eslint-disable indent */
// Files to create in our scaffold location.
const scaffoldFiles = [
  [
    '_posts/hello-world.md',
`---
title: Hello World!
date: ${dateNowFormatted}
tags:
- meta
---

Welcome to my site!
`,
  ],
  [
    'about.md',
`---
title: About
slug: about
date: ${dateNowFormatted}
---

Find out more about me.
`,
  ],
];
/* eslint-enable indent */

export default function init() {
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

  inquirer.prompt(questions).then((answers) => {
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

    // Copy scaffold files.
    try {
      scaffoldFiles.forEach(([filePath, fileContents]) => {
        fs.outputFileSync(
          path.join(destination, filePath),
          fileContents
        );
      });

      fs.outputFileSync(
        path.join(destination, Constants.ConfigFilename),
        fs.readFileSync(
          path.join(__dirname, '../lib/config/config-example.js'),
          'utf8'
        )
      );
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
      'reptar-theme-thread',
    ];

    log.info(`Installing npm packages: ${npmPackages.join(', ')}`);

    runCmd('npm', ['init', '--yes']);

    runCmd('npm', ['install', '--save'].concat(npmPackages));

    log.info(`New Reptar site created at ${destination}`);
    log.info('Now run `reptar build` and `reptar serve`');
  });
}
