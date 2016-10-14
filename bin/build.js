import log from '../lib/log';
import Yarn from '../lib';

export default function(options) {
  const id = log.startActivity('building\t\t\t');
  console.log('');

  var yarn = new Yarn(options);
  yarn.update()
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