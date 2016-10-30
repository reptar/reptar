import log from '../lib/log';
import Reptar from '../lib';

export default function () {
  const reptar = new Reptar();
  reptar.update()
    .then(reptar.cleanDestination.bind(reptar))
    .then(() => {
      process.exit(0);
    })
    .catch((e) => {
      log.error(e.stack);
      throw e;
    });
}
