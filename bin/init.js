import fs from 'fs-extra';
import logger from 'winston';
import path from 'path';
import inquirer from 'inquirer';
import child_process from 'child_process';

export default function init() {
  var destination = process.cwd();

  var questions = [
    {
      type: 'confirm',
      name: 'destinationOk',
      message: 'OK to create new yarn site at path: ' +
        destination + '?',
      default: true
    }
  ];

  inquirer.prompt(questions, function(answers) {
    if (answers.destinationOk === false) {
      process.exit(1);
    }

    var scaffoldSource = require('yarn-scaffold');

    // Copy scaffold project.
    try {
      fs.copySync(scaffoldSource, destination);
    } catch (e) {
      logger.error('Unable to copy scaffold contents into new yarn site.');
      logger.error(e);
    }

    // Create our package.json file. Grab the existing dependencies from the
    // scaffold package.json and create our clean new one.
    try {
      var scaffoldJson = require(path.join(destination, 'package.json'));

      var packageJsonData = {
        main: 'my-yarn-site',
        dependencies: scaffoldJson.dependencies
      };

      var packageJsonPath = path.join(destination, 'package.json');
      fs.outputFileSync(packageJsonPath, JSON.stringify(packageJsonData));
    } catch (e) {
      logger.error('Unable to create package.json file.');
      logger.error(e);
    }

    // Remove un-needed files.
    [
      '_site',
      'node_modules',
      'images/.gitkeep',
      '.npmignore',
      'scaffold.js',
      'README.md'
    ].forEach(function(dir) {
      var rmDir = path.join(destination, dir);

      try {
        fs.removeSync(rmDir);
      } catch (e) {
        // Fail silently, not a big deal to not be able to remove files.
      }
    });

    var npmInstallProc;
    try {
      npmInstallProc = child_process.spawn('npm', [
        'install'       // Disable caching.
      ], {
        stdio: 'inherit',
        cwd: destination
      });
    } catch (e) {
      logger.warn('Unable to run `npm install`');
    }

    npmInstallProc.on('close', function() {
      logger.info('New yarn site created at ' + destination);
    });
  });
}
