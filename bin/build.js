import log from '../lib/log';
import Reptar from '../lib';

export default async function build(options) {
  const id = log.startActivity('building\t\t\t');
  process.stdout.write('\n');

  const reptar = new Reptar(options);

  try {
    await reptar.update();
  } catch (e) {
    log.error(e.message);
    process.exit(1);
  }

  try {
    await reptar.build();
  } catch (e) {
    log.error(e.message);
    process.exit(1);
  }

  process.stdout.write('\n');
  log.endActivity(id);

  process.exit(0);
}
