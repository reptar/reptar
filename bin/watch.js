import activity from 'activity-logger';
import debounce from 'lodash/debounce';
import log from '../lib/log';
import Yarn from '../lib';
import chokidar from 'chokidar';
import serve from './serve';
import {
  configureTemplateEngine,
} from '../lib/template';

export default function() {
  log.setSilent(true);
  serve({
    showOutput: false
  });

  const startActivity = activity.start('Starting watching of files.');

  const yarn = new Yarn({
    incremental: true
  });
  const configPath = yarn.getConfig().get('path');

  // Turn off caching of templates.
  configureTemplateEngine({
    paths: yarn.theme.config.path.templates,
    noCache: true
  });

  yarn.loadState()
    .catch(function(e) {
      log.error(e.stack);
      throw e;
    });

  const watcher = chokidar.watch([
    configPath.source
  ], {
    ignored: [
      '.git/**/*',
      `${configPath.plugins}/**/*`,
      `${configPath.themes}/**/*`,
      `${configPath.destination}/**/*`
    ]
  });

  // Wait for watcher to be ready before registering other watchers.
  watcher.on('ready', function() {
    activity.end(startActivity);

    console.log('');
    log.info('Ready...\n');

    function handleFsChange(event, path) {
      log.info('Change detected at: ' + path);
      const id = activity.start('Rebuilding...');

      yarn.readFiles(path).then(function() {
        return yarn.build();
      }).then(() => {
        activity.end(id);

        const date = new Date();
        log.info('\t\tdone! (' + date.toISOString() + ')');
        console.log('');
      });
    }

    // Watch for all fs events.
    watcher.on('all', debounce(handleFsChange, 100));
  });

  // Handle when theme files change and re-build entire source to reflect new
  // theme changes.
  const themeWatcher = chokidar.watch([
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
