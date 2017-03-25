import log from '../log';
import Reptar from '../index';

export default async function build(options) {
  const id = log.startActivity('building\t\t\t');
  process.stdout.write('\n');

  const reptar = new Reptar(options);
  await reptar.update();
  await reptar.build();

  process.stdout.write('\n');
  log.endActivity(id);

  process.exit(0);
}
