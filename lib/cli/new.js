import _ from 'lodash';
import path from 'path';
import moment from 'moment';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import Config from '../config';
import Url from '../url';
import log from '../log';

const newTypes = {
  file: {
    prompts: [
      {
        name: 'title',
        type: 'input',
        message: 'Title of new file.',
        validate: input => !_.isNil(input),
      },
    ],
    template: data => (
`---
title: ${data.title}
date: ${data.date}
---
`
    ),
  },
};

export default async function (args) {
  const newTypeKey = args._[1];
  const newType = newTypes[newTypeKey];
  if (_.isNil(newType)) {
    log.error(`Unknown type: '${newTypeKey}'.`);
    log.error(
      `Types supported: ${Object.keys(newTypes).join(',')}`
    );
    log.error('Use via: reptar new <type>');
    process.exit(0);
  }

  log.info(`Create new "${newTypeKey}"`);

  const config = new Config();
  config.update();

  const data = await inquirer.prompt(newType.prompts);

  // Set date to now.
  data.date = moment().format('YYYY-MM-DD');

  const filePath = Url.interpolatePermalink(
    config.get('newFilePermalink'),
    data
  ).toLowerCase();
  const fileContent = newType.template(data);
  const absolutePath = path.join(config.get('path.source'), filePath);

  // Write file!
  fs.outputFileSync(absolutePath, fileContent, 'utf8');

  log.info(`New ${newTypeKey} created at ${absolutePath}`);
}
