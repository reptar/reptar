import Promise from 'bluebird';
import activity from 'activity-logger';
import _ from 'lodash';
import log from '../lib/log';
import { YAML } from '../lib/constants';
import Reptar from '../lib';
import chokidar from 'chokidar';
import serve from './serve';

export default function() {
  log.setSilent(true);
  serve({
    showOutput: false
  });

  const startActivity = activity.start('Starting watching files.');

  const reptar = new Reptar({
    // Turn on incremental building.
    incremental: true,

    // Turn off caching of templates.
    noTemplateCache: true
  });

  reptar.update()
    .catch(function(e) {
      log.error(e.stack);
      throw e;
    });

  const configPath = reptar.getConfig().get('path');

  const watcher = chokidar.watch([
    configPath.source
  ], {
    atomic: true,
  });

  function shouldIgnorePath(path) {
    return [
      '/.git/', // ignore .git directory.
      configPath.plugins,
      configPath.themes,
      configPath.destination
    ].some(configPath => path.indexOf(configPath) > -1);
  }

  // Wait for watcher to be ready before registering other watchers.
  watcher.on('ready', function() {
    activity.end(startActivity);

    console.log('');
    log.info('Ready...\n');

    function handleFsChange(event, path) {
      if (shouldIgnorePath(path)) {
        return;
      }

      log.info('Change detected at: ' + path);

      const id = activity.start('Rebuilding...');

      let promise;
      // If `_config.yml` changed then re-load from fs.
      if (path.indexOf(YAML.CONFIG) > -1) {
        promise = reptar.update();
      } else {
        promise = Promise.resolve();
      }

      promise.then(function() {
        return reptar.readFiles(path);
      }).then(function() {
        return reptar.build();
      }).then(() => {
        activity.end(id);

        const date = new Date();
        log.info('\t\tdone! (' + date.toISOString() + ')');
        console.log('');
      });
    }

    // Watch for all fs events.
    watcher.on('all', _.debounce(handleFsChange, 200));
  });

  // Handle when theme files change and re-build entire source to reflect new
  // theme changes.
  const themeWatcher = chokidar.watch([
    configPath.themes
  ]);
  themeWatcher.on('ready', function() {

    themeWatcher.on('change', function(path) {
      log.info('Theme file changed at: ' + path);
      const id = activity.start('Rebuilding...');

      reptar.update()
        .then(function() {
          return reptar.build();
        }).then(function() {
          activity.end(id);

          const date = new Date();
          log.info('\t\tdone! (' + date.toISOString() + ')');
          console.log('');
        });
    });
  });
}
