import Reptar from '../lib';

export default function() {
  const reptar = new Reptar();
  reptar.update()
    .then(reptar.cleanDestination.bind(reptar))
    .then(function() {
      process.exit(0);
    })
    .catch(function(e) {
      console.log(e.stack);
      throw e;
    });
}