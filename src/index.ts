#!/usr/bin/env node

/**
 * Scripts for Sheetbase modules and apps.
 */

const program = require('commander');
import chalk from 'chalk';
const yellow = chalk.yellow;

import buildCommand from './controllers/build.controller';
import pushCommand from './controllers/push.controller';

/**
 * Set global CLI configurations
 */
program
  .version(require('./package.json').version, '-v, --version')
  .usage('sheetbase-app-scripts [options] [command]')
  .description('Scripts for Sheetbase modules and apps');

program
  .command('build')
  .option('-p, --prod', 'Production build for app.')
  .description(`Build module of app for GAS deployment.`)
  .action(async (options) => await buildCommand(options));

program
  .command('push')
  .description(`Push module of app to GAS using @google/clasp.`)
  .action(async () => await pushCommand());

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