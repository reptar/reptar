const logger = require('winston');
const isNil = require('lodash/isNil');
const path = require('path');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const Url = require('../lib/url');

let newTypes = {
  file: {
    prompts: [
      {
        name: 'title',
        type: 'input',
        message: 'Title of new file.',
        validate: (input) => !isNil(input)
      }
    ],
    template: (data) => (
`---
title: ${data.title}
date: ${data.date.toISOString()}
---
`
    )
  },
};

module.exports = function(args) {
  let newTypeKey = args._[1];
  let newType = newTypes[newTypeKey];
  if (isNil(newType)) {
    logger.warn(`Unknown new type: '${newTypeKey}'.`);
    logger.warn(`Only support new types ` +
      `[${Object.keys(newTypes).join(', ')}].`);
    process.exit(0);
  }

  var config = require('../lib/config');
  config.setRoot(config.findLocalDir());

  function promptHandler(data) {
    // Set date to now.
    data.date = new Date();

    let filePath = Url.interpolatePermalink(config.new_file_permalink, data);
    let fileContent = newType.template(data);
    let absolutePath = path.join(config.path.source, filePath);

    // Write file!
    fs.outputFileSync(absolutePath, fileContent, 'utf8');

    logger.info(`New ${newTypeKey} created at ${absolutePath}`);
  }

  inquirer.prompt(newType.prompts, promptHandler);
};
