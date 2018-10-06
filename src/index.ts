#!/usr/bin/env node

// TODO: TODO
// TODO: generate docs from types/module.ts


/**
 * Scripts for Sheetbase modules and apps.
 */

import chalk from 'chalk';
const program = require('commander');

import buildCommand from './controllers/build.controller';
import pushCommand from './controllers/push.controller';

import { getSheetbaseDependencies } from './services/npm/npm.service';

/**
 * Set global CLI configurations
 */
program
  .version(require('./package.json').version, '-v, --version')
  .usage('sheetbase-app-scripts [options] [command]')
  .description('Scripts for Sheetbase modules and apps');

program
  .command('build [name]')
  .option('--app', 'Build an app, else a module.')
  .option('--vendor', 'A vendor module.')
  .option('--bundle', 'Merge dependencies with the module.')
  .description(`Build module of app for GAS deployment.`)
  .action(async (name, options) => await buildCommand(name, options));

program
  .command('push')
  .description(`Push module of app to GAS using @google/clasp.`)
  .action(async () => await pushCommand());

program
  .command('test')
  .description(`Test`)
  .action(async () => {
    console.log(await getSheetbaseDependencies());
  });

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