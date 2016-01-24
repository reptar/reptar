import child_process from 'child_process';
import Config from '../lib/config';

export default function() {
  let config = Config.create();

  var destination = config.path.destination || './_site';

  child_process.spawn('http-server', [
    destination,
    '-p ' + (config.server.port || 8080),
    '-d',
    '-c-1'
  ], {
    stdio: 'inherit'
  });
}
