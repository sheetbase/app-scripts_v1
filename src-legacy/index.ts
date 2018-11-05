#!/usr/bin/env node

/**
 * Scripts for Sheetbase modules and apps.
 */

import chalk from 'chalk';
import * as program from 'commander';

import { buildCommand } from './commands/build/build';
import { readmeCommand } from './commands/readme/readme';
import { pushCommand } from './commands/push/push';

/**
 * Set global CLI configurations
 */
program
  .version(require('../package.json').version, '-v, --version')
  .usage('sheetbase-app-scripts-legacy [options] [command]')
  .description(chalk.red('(DEPRECATED)') + ' Scripts for developing Sheetbase backend modules and apps.');

/**
 * Build module or app for GAS deployment.
 * @name build
 * @param {string?} [exportName] Module name.
 * @param {string?} [--param] Module params, comma-seperated.
 * @param {boolean?} [--app] Build an app, else a module.
 * @param {boolean?} [--vendor] Build a vendor module.
 * @param {boolean?} [--bundle] Merge dependencies with the module.
 * @param {boolean?} [--polyfill] Include polyfill.
 * @param {boolean?} [--no-init] Not init the default instance of the module.
 * @param {string?} [--copy] Files or folders will be copied, comma-seperated.
 */
program
  .command('build [exportName]')
  .option('--param [value]', 'Module params, seperated by commas.')
  .option('--app', 'Build an app, else a module.')
  .option('--vendor', 'Build a vendor module.')
  .option('--bundle', 'Merge dependencies with the module.')
  .option('--polyfill', 'Include polyfill.')
  .option('--no-init', 'Not init the default instance of the module.')
  .option('--copy [value]', 'Files or folders will be copied, seperated by commas.')
  .description(`Build module or app for GAS deployment.`)
  .action(async (exportName, options) => await buildCommand(exportName, options));

/**
 * Generate README.md.
 * @name readme
 * @param {string?} [exportName] Module name.
 * @param {boolean?} [--no-docs] No docs link.
 */
program
  .command('readme [exportName]')
  .option('--no-docs', 'No docs link.')
  .description('Generate README.md.')
  .action(async (exportName, options) => await readmeCommand(exportName, options));

/**
 * Push module or app to GAS using @google/clasp.
 * Must have @google/clasp installed and logged in.
 * @name push
 * @param {string?} [dir] GAS code folder.
 */
program
.command('push [dir]')
.description('Push module or app to GAS using @google/clasp.')
.action(async (dir) => await pushCommand(dir));

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