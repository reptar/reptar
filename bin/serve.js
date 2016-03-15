import child_process from 'child_process';
import Config from '../lib/config';

export default function() {
  let config = Config.create();

  child_process.spawn('http-server', [
    config.get('path.destination'),
    '-p ' + config.get('server.port'),
    '-d',
    '-c-1'
  ], {
    stdio: 'inherit'
  });
}
