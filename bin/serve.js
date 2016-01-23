import child_process from 'child_process';
import config from '../lib/config';

export default function() {
  config.setRoot(config.findLocalDir());

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
