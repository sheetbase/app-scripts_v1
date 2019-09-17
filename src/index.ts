#!/usr/bin/env node

/**
 * Scripts for Sheetbase modules and apps.
 */

import chalk from 'chalk';
import * as program from 'commander';

import { buildCommand } from './commands/build';
import { docsCommand } from './commands/docs';

/**
 * Set global CLI configurations
 */
program
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
program
  .command('build')
  .description('Build module or app for GAS deployment.')
  .option('--module', 'Build a module.')
  .option('--tsc [params]', 'Custom tsc params.')
  .option('--rollup [params]', 'Custom rollup params.')
  .option('--copy [value]', 'Resources to be copied, comma-seperated.')
  .option('--vendor [value]', 'List of files for @vendor.js, comma-seperated.')
  .action(options => buildCommand(options));

/**
 * Generate the documentation.
 * @name docs
 * @param {string?} [--typedoc] Custom typedoc params.
 */
program
  .command('docs')
  .description('Generate the documentation.')
  .option('--typedoc [params]', 'Custom typedoc params.')
  .action(options => docsCommand(options));

/**
 * Display help.
 * @name help
 */
program
  .command('help')
  .description('Display help.')
  .action(() => {
    program.outputHelp();
    return process.exit();
  });

/**
 * Any other command is not supported.
 * @name *
 */
program.command('*', 'Any other command is not supported.').action(cmd => {
  console.error(chalk.red(`\nUnknown command '${cmd}'`));
  return process.exit(1);
});

// show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
