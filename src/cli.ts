import chalk from 'chalk';
import * as commander from 'commander';

import { buildCommand } from './commands/build';
import { docsCommand } from './commands/docs';

export function cli() {
  commander
    .version(require('../package.json').version, '-v, --version')
    .usage('sheetbase-app-scripts [options] [command]')
    .description('Scripts for Sheetbase backend modules and apps.');

  commander
    .command('build')
    .description('Build distribution package.')
    .option('--copy [value]', 'Copied resources, comma-seperated.')
    .option('--vendor [value]', 'Files for @vendor.js, comma-seperated.')
    .action(options => buildCommand(options));

  commander
    .command('docs')
    .description('Generate the documentation.')
    .action(docsCommand);

  commander
    .command('help')
    .description('Display help.')
    .action(() => commander.outputHelp());

  commander
    .command('*')
    .description('Any other command is not supported.')
    .action(cmd => console.error(chalk.red(`Unknown command '${cmd}'`)));

  return commander;
}
