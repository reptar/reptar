import log from '../lib/log';
import isNil from 'lodash/isNil';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import Config from '../lib/config';
import Url from '../lib/url';

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

export default function(args) {
  let newTypeKey = args._[1];
  let newType = newTypes[newTypeKey];
  if (isNil(newType)) {
    log.warn(`Unknown new type: '${newTypeKey}'.`);
    log.warn(`Only support new types ` +
      `[${Object.keys(newTypes).join(', ')}].`);
    process.exit(0);
  }

  let config = Config.create();

  function promptHandler(data) {
    // Set date to now.
    data.date = new Date();

    let filePath = Url.interpolatePermalink(config.new_file_permalink, data);
    let fileContent = newType.template(data);
    let absolutePath = path.join(config.path.source, filePath);

    // Write file!
    fs.outputFileSync(absolutePath, fileContent, 'utf8');

    log.info(`New ${newTypeKey} created at ${absolutePath}`);
  }

  inquirer.prompt(newType.prompts, promptHandler);
}
