import log from '../lib/log';
import Reptar from '../lib';

export default function(options) {
  const id = log.startActivity('building\t\t\t');
  console.log('');

  const reptar = new Reptar(options);
  reptar.update()
    .then(reptar.build.bind(reptar))
    .then(function() {
      console.log('');
      log.endActivity(id);

      process.exit(0);
    })
    .catch(function(e) {
      console.log(e.stack);
      throw e;
    });
}