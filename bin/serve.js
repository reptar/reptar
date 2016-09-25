import liveServer from 'live-server';
import Config from '../lib/config';

export default function() {
  const config = Config.create();

  liveServer.start({
    port: config.get('server.port'),
    root: config.get('path.destination'),
    open: false,
    logLevel: 2,
  });
}
