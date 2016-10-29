import chalk from 'chalk';
import activity from 'activity-logger';

let verboseMode = true;
let isSilent = false;

export default {
  setLogLevel(logLevel) {
    verboseMode = logLevel === 'verbose';
  },

  setSilent(newSilent = false) {
    isSilent = newSilent;
  },

  info(...args) {
    const prefix = chalk.green('info') + ':\t';
    args.unshift(prefix);
    console.log.apply(console, args);
  },

  warn(...args) {
    if (!verboseMode) {
      return;
    }
    const prefix = chalk.yellow('warn') + ':\t';
    args.unshift(prefix);
    console.log.apply(console, args);
  },

  error(...args) {
    const prefix = chalk.red('error') + ':\t';
    args.unshift(prefix);
    console.log.apply(console, args);
  },

  startActivity(name) {
    if (isSilent) {
      return;
    }
    return activity.start(name);
  },

  endActivity(id) {
    if (isSilent) {
      return;
    }
    return activity.end(id);
  },
};
