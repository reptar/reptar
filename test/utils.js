import path from 'path';

export function getPathToScaffold() {
  return path.resolve(
    __dirname,
    '../node_modules/yarn-scaffold'
  );
}