#!/usr/bin/env node

/**
 * Scripts for Sheetbase modules and apps.
 */

import chalk from 'chalk';
import * as program from 'commander';

import { buildCommand } from './commands/build';
import { readmeCommand } from './commands/readme';
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
 * @param {boolean?} [--min] Use the minified version for deployment.
 * @param {string?} [--vendor] List of files to put into @vendor.js, comma-seperated.
 * @param {boolean?} [--not-transpile] Do not run tsc.
 * @param {string?} [--tsc] Custom tsc params.
 * @param {boolean?} [--not-bundle] Do not run rollup.
 * @param {string?} [--rollup] Custom rollup params.
 * @param {boolean?} [--not-minify] Do not run uglifyjs.
 * @param {string?} [--uglifyjs] Custom uglifyjs params.
 * @param {string?} [--copy] Resources to be copied, comma-seperated.
 * @param {string?} [--rename] Rename bundled deployment file.
 */
program
  .command('build')
  .option('--module', 'Build a module.')
  .option('--min', 'Use the minified version for deployment.')
  .option('--vendor [value]', 'List of files for @vendor.js, comma-seperated.')
  .option('--not-transpile', 'Do not run tsc.')
  .option('--tsc [params]', 'Custom tsc params.')
  .option('--not-bundle', 'Do not run rollup.')
  .option('--rollup [params]', 'Custom rollup params.')
  .option('--not-minify', 'Do not run uglifyjs.')
  .option('--uglifyjs [params]', 'Custom uglifyjs params.')
  .option('--copy [value]', 'Resources to be copied, comma-seperated.')
  .option('--rename [value]', 'Rename bundled deployment file.')
  .description('Build module or app for GAS deployment.')
  .action(async (options) => await buildCommand(options));

/**
 * Generate README.md.
 * @name readme
 * @param {boolean?} [--not-docs] No docs link.
 */
program
  .command('readme')
  .option('--not-docs', 'No docs link.')
  .description('Generate README.md.')
  .action(async (options) => await readmeCommand(options));

/**
 * Generate the documentation.
 * @name docs
 * @param {boolean?} [--not-api] Do not run typedoc.
 * @param {string?} [--typedoc] Custom typedoc params.
 */
program
  .command('docs')
  .option('--not-api', 'Do not run typedoc.')
  .option('--typedoc [params]', 'Custom typedoc params.')
  .description('Generate the documentation.')
  .action(async (options) => await docsCommand(options));

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