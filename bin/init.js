var inquirer = require('inquirer');

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
  });
};
