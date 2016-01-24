import logger from 'winston';
import Yarn from '../lib';
import chokidar from 'chokidar';
import serve from './serve';
import Render from '../lib/render';

export default function() {
  serve();

  let yarn = new Yarn();
  let config = yarn.getConfig();

  Render.configureTemplate({
    paths: [
      yarn.theme.config.path.templates
    ],
    cacheTemplates: true
  });

  yarn.readFiles()
    .catch(function(e) {
      console.log(e.stack);
      throw e;
    });

  var watcher = chokidar.watch([
    config.path.source
  ], {
    ignored: [
      config.path.plugins,
      config.path.themes,
      config.path.destination
    ]
  });

  // Wait for watcher to be ready before registering other watchers.
  watcher.on('ready', function() {

    watcher.on('change', function(path) {
      logger.info('File changed at: ' + path);
      logger.info('Rebuilding...');
      yarn.fileChanged(path).then(function() {
        logger.info('\tdone!');
      });
    });

    watcher.on('add', function(path) {
      logger.info('File added at: ' + path);
      logger.info('Rebuilding...');
      yarn.fileAdded(path).then(function() {
        logger.info('\tdone!');
      });
    });

    watcher.on('unlink', function(path) {
      logger.info('File removed at: ' + path);
      logger.info('Rebuilding...');
      yarn.fileRemoved(path).then(function() {
        logger.info('\tdone!');
      });
    });
  });

  // Handle when theme files change and re-build entire source to reflect new
  // theme changes.
  var themeWatcher = chokidar.watch([
    config.path.themes
  ]);
  themeWatcher.on('ready', function() {

    themeWatcher.on('change', function(path) {
      logger.info('Theme file changed at: ' + path);
      logger.info('Rebuilding...');
      yarn.readTheme()
        .then(function() {
          return yarn.build();
        });
    });
  });
}
