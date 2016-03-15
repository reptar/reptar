import log from '../lib/log';
import Yarn from '../lib';
import chokidar from 'chokidar';
import serve from './serve';
import Render from '../lib/render';

export default function() {
  serve();

  let yarn = new Yarn();
  let config = yarn.getConfig();
  const configPath = config.get('path');

  Render.configureTemplate({
    paths: yarn.theme.config.path.templates,
    cacheTemplates: true
  });

  yarn.loadState()
    .catch(function(e) {
      console.log(e.stack);
      throw e;
    });

  var watcher = chokidar.watch([
    configPath.source
  ], {
    ignored: [
      configPath.plugins,
      configPath.themes,
      configPath.destination
    ]
  });

  // Wait for watcher to be ready before registering other watchers.
  watcher.on('ready', function() {

    watcher.on('change', function(path) {
      log.info('File changed at: ' + path);
      log.info('Rebuilding...');
      yarn.fileChanged(path).then(function() {
        log.info('\tdone!');
      });
    });

    watcher.on('add', function(path) {
      log.info('File added at: ' + path);
      log.info('Rebuilding...');
      yarn.fileAdded(path).then(function() {
        log.info('\tdone!');
      });
    });

    watcher.on('unlink', function(path) {
      log.info('File removed at: ' + path);
      log.info('Rebuilding...');
      yarn.fileRemoved(path).then(function() {
        log.info('\tdone!');
      });
    });
  });

  // Handle when theme files change and re-build entire source to reflect new
  // theme changes.
  var themeWatcher = chokidar.watch([
    configPath.themes
  ]);
  themeWatcher.on('ready', function() {

    themeWatcher.on('change', function(path) {
      log.info('Theme file changed at: ' + path);
      log.info('Rebuilding...');
      yarn.readTheme()
        .then(function() {
          return yarn.build();
        });
    });
  });
}
