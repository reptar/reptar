import fs from 'fs-extra';
import log from '../lib/log';
import path from 'path';
import inquirer from 'inquirer';
import spawn from 'cross-spawn';

/* eslint-disable indent */
// Files to create in our scaffold location.
const scaffoldFiles = [
  [
    '_posts/hello-world.md',
`---
title: Hello World!
date: ${(new Date()).toISOString()}
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
date: ${(new Date()).toISOString()}
---

Find out more about me.
`
  ],
];
/* eslint-enable indent */

export default function init() {
  const destination = process.cwd();

  const questions = [
    {
      type: 'confirm',
      name: 'destinationOk',
      message: 'OK to create new Reptar site at path: ' +
        destination + '?',
      default: true
    }
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
        path.join(destination, '_config.yml'),
        fs.readFileSync(
          path.join(__dirname, '../lib/config/config_example.yml'),
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
        cwd: destination
      });
    }

    log.info('Installing npm packages.');

    runCmd('npm', ['init', '--yes']);

    const npmPackages = [
      'reptar-excerpt',
      'reptar-html-minifier',
      'reptar-theme-thread',
    ];
    runCmd('npm', ['install', '--save'].concat(npmPackages));

    log.info('New Reptar site created at ' + destination);
  });
}
