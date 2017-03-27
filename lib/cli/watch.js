import activity from 'activity-logger';
import Server from '../server/server';
import log from '../log';
import Reptar from '../index';

export default async function watch(options = {}) {
  const startActivity = activity.start('Starting watch.\t\t\t\t');

  const reptar = new Reptar({
    // Turn off caching of templates.
    noTemplateCache: true,
    showSpinner: false,
    ...options,
  });

  await reptar.update();

  const server = new Server(reptar);
  await server.start();

  activity.end(startActivity);

  process.stdout.write('\n');
  log.info('Server running at:', server.server.info.uri);
}
