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
  .description('Scripts for Sheetbase modules and apps');

/**
 * Build module of app for GAS deployment.
 * @name build
 * @param {string?} [exportName] Optional export name or use the folder name.
 * @param {string?} [--app] Build an app, else a module.
 * @param {string?} [--vendor] A vendor module.
 * @param {string?} [--bundle] Merge dependencies with the module.
 * @example build > (build a module).
 * @example build --app > (build a backend app).
 * @example build --vendor > (build a module that ported from an package).
 * @example build --bundle > (build a module and add bundle all dependencies to the output file).
 */
program
  .command('build [exportName]')
  .option('--app', 'Build an app, else a module.')
  .option('--vendor', 'A vendor module.')
  .option('--bundle', 'Merge dependencies with the module.')
  .description(`Build module of app for GAS deployment.`)
  .action(async (exportName, options) => await buildCommand(exportName, options));

/**
 * Push module of app to GAS using @google/clasp.
 * @name push
 * @example push > (push content in 'dist' folder).
 */
program
  .command('push')
  .description('Push module of app to GAS using @google/clasp.')
  .action(async () => await pushCommand());

/**
 * Generate README.md.
 * @name readme
 * @param {string?} [exportName] Optional export name or use the folder name.
 * @param {string?} [--no-docs] No docs link.
 * @example readme > (update the readme file).
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
 * @example foo
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