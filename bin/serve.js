import Hapi from 'hapi';
import inert from 'inert';
import Config from '../lib/config';
import log from '../lib/log';

export default async function serve() {
  const config = new Config();
  config.update();

  const server = new Hapi.Server({
    connections: {
      routes: {
        files: {
          relativeTo: config.get('path.destination'),
        },
      },
    },
  });

  server.connection({
    host: config.get('server.host'),
    port: config.get('server.port'),
  });

  await server.register([
    inert,
  ]);

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: '.',
        redirectToSlash: true,
        index: true
      },
    }
  });

  server.start();

  log.info('Server running at:', server.info.uri);
}
