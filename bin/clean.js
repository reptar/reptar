import Yarn from '../lib';

export default function() {

  var yarn = new Yarn();
  yarn.update()
    .then(yarn.cleanDestination.bind(yarn))
    .then(function() {
      process.exit(0);
    })
    .catch(function(e) {
      console.log(e.stack);
      throw e;
    });
}