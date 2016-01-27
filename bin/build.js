import log from '../lib/log';
import Yarn from '../lib';

export default function() {
  const id = log.startActivity('building');
  console.log('');

  var yarn = new Yarn();
  yarn.loadState()
    .then(yarn.build.bind(yarn))
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