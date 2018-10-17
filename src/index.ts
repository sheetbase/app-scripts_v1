#!/usr/bin/env node

/**
 * Scripts for Sheetbase modules and apps.
 */

import chalk from 'chalk';
const program = require('commander');

import buildCommand from './controllers/build.controller';
import pushCommand from './controllers/push.controller';
import readmeCommand from './controllers/readme.controller';

/**
 * Set global CLI configurations
 */
program
  .version(require('./package.json').version, '-v, --version')
  .usage('sheetbase-app-scripts [options] [command]')
  .description('Scripts for Sheetbase backend modules and apps');

/**
 * Build module or app for GAS deployment.
 * @name build
 */
program
  .command('build [exportName]')
  .option('--param [value]', 'Module params, seperated by commas.')
  .option('--app', 'Build an app, else a module.')
  .option('--vendor', 'A vendor module.')
  .option('--bundle', 'Merge dependencies with the module.')
  .option('--polyfill', 'Include polyfill.')
  .option('--no-init', 'Not init the default instance of the module.')
  .option('--copy [value]', 'Files or folders will be copied, seperated by commas.')
  .description(`Build module or app for GAS deployment.`)
  .action(async (exportName, options) => await buildCommand(exportName, options));

/**
 * Push module or app to GAS using @google/clasp.
 * @name push
 */
program
  .command('push')
  .description('Push module or app to GAS using @google/clasp.')
  .action(async () => await pushCommand());

/**
 * Generate README.md.
 * @name readme
 */
program
  .command('readme [exportName]')
  .option('--no-docs', 'No docs link.')
  .description('Generate README.md.')
  .action(async (exportName, options) => await readmeCommand(exportName, options));

/**
 * Displays the help.
 * @name help
 */
program
  .command('help')
  .description('Output help.')
  .action(() => {
    return program.outputHelp();
  });

/**
 * All other commands are given a help message.
 */
program
  .command('*', { isDefault: true })
  .description('Any other command is not supported.')
  .action((cmd) => {
    return console.log(chalk.red(`\nUnknown command '${cmd}'`));
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);