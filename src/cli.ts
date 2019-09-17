import chalk from 'chalk';
import * as commander from 'commander';

import { buildCommand } from './commands/build';
import { docsCommand } from './commands/docs';

export function cli() {
  /**
   * Set global CLI configurations
   */
  commander
    .version(require('../package.json').version, '-v, --version')
    .usage('sheetbase-app-scripts [options] [command]')
    .description('Scripts for developing Sheetbase backend modules and apps.');

  /**
   * Build module or app for GAS deployment.
   * @name build
   * @param {boolean?} [--module] Build a module.
   * @param {string?} [--tsc] Custom tsc params.
   * @param {string?} [--rollup] Custom rollup params.
   * @param {string?} [--copy] Resources to be copied, comma-seperated.
   * @param {string?} [--vendor] List of files to put into @vendor.js, comma-seperated.
   */
  commander
    .command('build')
    .description('Build module or app for GAS deployment.')
    .option('--module', 'Build a module.')
    .option('--tsc [params]', 'Custom tsc params.')
    .option('--rollup [params]', 'Custom rollup params.')
    .option('--copy [value]', 'Resources to be copied, comma-seperated.')
    .option(
      '--vendor [value]',
      'List of files for @vendor.js, comma-seperated.'
    )
    .action(options => buildCommand(options));

  /**
   * Generate the documentation.
   * @name docs
   * @param {string?} [--typedoc] Custom typedoc params.
   */
  commander
    .command('docs')
    .description('Generate the documentation.')
    .option('--typedoc [params]', 'Custom typedoc params.')
    .action(options => docsCommand(options));

  /**
   * Display help.
   * @name help
   */
  commander
    .command('help')
    .description('Display help.')
    .action(() => commander.outputHelp());

  /**
   * Any other command is not supported.
   * @name *
   */
  commander
    .command('*')
    .description('Any other command is not supported.')
    .action(cmd => console.error(chalk.red(`Unknown command '${cmd}'`)));

  return commander;
}
