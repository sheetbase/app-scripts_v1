#!/usr/bin/env node

/**
 * Scripts for Sheetbase modules and apps.
 */

import chalk from 'chalk';
import * as program from 'commander';

import { buildCommand } from './commands/build';
import { readmeCommand } from './commands/readme';
import { deployCommand } from './commands/deploy';
import { apiCommand } from './commands/api';

/**
 * Set global CLI configurations
 */
program
  .version(require('../package.json').version, '-v, --version')
  .usage('sheetbase-app-scripts [options] [command]')
  .description('Scripts for developing Sheetbase backend modules and apps.');

/**
 * Deploy code to GAS using @google/clasp.
 * Must have @google/clasp installed and logged in.
 * @name deploy
 * @param {string?} [dir] GAS code folder.
 */
program
  .command('deploy [dir]')
  .description('Deploy code to GAS using @google/clasp.')
  .action(async (dir) => await deployCommand(dir));

/**
 * Build module or app for GAS deployment.
 * @name build
 * @param {boolean?} [--no-transpile] Do not run tsc.
 * @param {boolean?} [--no-bundle] Do not run rollup.
 * @param {string?} [--tsc] Custom tsc params.
 * @param {string?} [--rollup] Custom rollup params.
 * @param {string?} [--copy] Resources to be copied, comma-seperated.
 */
program
  .command('build')
  .option('--no-transpile', 'Do not run tsc.')
  .option('--no-bundle', 'Do not run rollup.')
  .option('--tsc [params]', 'Custom tsc params.')
  .option('--rollup [params]', 'Custom rollup params.')
  .option('--copy [value]', 'Resources to be copied, comma-seperated.')
  .description('Build module or app for GAS deployment.')
  .action(async (options) => await buildCommand(options));

/**
 * Generate README.md.
 * @name readme
 * @param {boolean?} [--no-docs] No docs link.
 */
program
  .command('readme')
  .option('--no-docs', 'No docs link.')
  .description('Generate README.md.')
  .action(async (options) => await readmeCommand(options));

/**
 * Generate API reference.
 * @name api
 * @param {string?} [--typedoc] Custom typedoc params.
 */
program
  .command('api')
  .description('Generate API reference.')
  .option('--typedoc [params]', 'Custom typedoc params.')
  .action(async (options) => await apiCommand(options));

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
program
  .command('*')
  .description('Any other command is not supported.')
  .action((cmd) => {
    console.error(chalk.red(`\nUnknown command '${cmd}'`));
    return process.exit(1);
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);