import log from '../lib/log';
import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import Config from '../lib/config';
import Url from '../lib/url';

const newTypes = {
  file: {
    prompts: [
      {
        name: 'title',
        type: 'input',
        message: 'Title of new file.',
        validate: (input) => !_.isNil(input)
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

export default function(args) {
  const newTypeKey = args._[1];
  const newType = newTypes[newTypeKey];
  if (_.isNil(newType)) {
    log.error(`Unknown new type: '${newTypeKey}'.`);
    log.error(`Only support new types [${Object.keys(newTypes).join(', ')}].`);
    process.exit(0);
  }

  const config = new Config();
  config.update();

  function promptHandler(data) {
    // Set date to now.
    data.date = new Date();

    const filePath = Url.interpolatePermalink(
      config.get('new_file_permalink'),
      data
    ).toLowerCase();
    const fileContent = newType.template(data);
    const absolutePath = path.join(config.get('path.source'), filePath);

    // Write file!
    fs.outputFileSync(absolutePath, fileContent, 'utf8');

    log.info(`New ${newTypeKey} created at ${absolutePath}`);
  }

  inquirer.prompt(newType.prompts).then(promptHandler);
}
