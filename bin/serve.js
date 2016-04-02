import child_process from 'child_process';
import Url from '../lib/url';
import Config from '../lib/config';

export default function(options) {
  const config = Config.create();

  const httpServerPath = Url.pathFromRoot(
    './node_modules/.bin/http-server'
  );

  child_process.spawn(httpServerPath, [
    config.get('path.destination'),
    '-p ' + config.get('server.port'),
    '-d',
    '-c-1'
  ], {
    stdio: options.showOutput !== false ? 'inherit' : 'ignore'
  });
}
