var fs = require('fs-extra');
var logger = require('winston');
var path = require('path');
var inquirer = require('inquirer');
var child_process = require('child_process');

module.exports = function init() {
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

    var scaffoldSource = path.join(__dirname, '../node_modules/yarn-scaffold');

    try {
      fs.copySync(scaffoldSource, destination);
    } catch (e) {
      logger.error('Unable to initialize a new yarn site.');
    }

    [
      '_site',
      'node_modules'
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
      logger.warn('Unable to fun `npm install`');
    }

    npmInstallProc.on('close', function() {
      logger.info('New yarn site created at ' + destination);
    });
  });
};
