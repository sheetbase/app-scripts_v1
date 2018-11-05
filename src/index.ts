#!/usr/bin/env node

/**
 * Scripts for Sheetbase modules and apps.
 */

import chalk from 'chalk';
import * as program from 'commander';

import { buildCommand } from './commands/build/build';
import { readmeCommand } from './commands/readme/readme';
import { deployCommand } from './commands/deploy/deploy';

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