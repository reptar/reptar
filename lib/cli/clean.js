import Reptar from '../index';

export default async function () {
  const reptar = new Reptar();
  await reptar.update();
  await reptar.cleanDestination();
  process.exit(0);
}
