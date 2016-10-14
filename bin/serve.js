import liveServer from 'live-server';
import Config from '../lib/config';

export default function() {
  const config = new Config();
  config.update();

  liveServer.start({
    port: config.get('server.port'),
    root: config.get('path.destination'),
    open: false,
    logLevel: 2,
  });
}
