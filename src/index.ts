#!/usr/bin/env node

/**
 * Scripts for Sheetbase modules and apps.
 */

import chalk from 'chalk';
import * as program from 'commander';

import { buildCommand } from './commands/build';
import { readmeCommand } from './commands/readme';
import { deployCommand } from './commands/deploy';
import { docsCommand } from './commands/docs';

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
 * @param {boolean?} [--version] Also saving a new version.
 */
program
  .command('deploy [dir]')
  .option('--version', 'Also saving a new version.')
  .description('Deploy code to GAS using @google/clasp.')
  .action(async (dir, options) => await deployCommand(dir, options));

/**
 * Build module or app for GAS deployment.
 * @name build
 * @param {boolean?} [--app] Build an app.
 * @param {string?} [--vendor] List of files to put into @vendor.js.
 * @param {boolean?} [--min] Use the minified version for deployment.
 * @param {boolean?} [--no-transpile] Do not run tsc.
 * @param {string?} [--tsc] Custom tsc params.
 * @param {boolean?} [--no-bundle] Do not run rollup.
 * @param {string?} [--rollup] Custom rollup params.
 * @param {boolean?} [--no-minify] Do not run uglifyjs.
 * @param {string?} [--uglifyjs] Custom uglifyjs params.
 * @param {string?} [--copy] Resources to be copied, comma-seperated.
 * @param {string?} [--rename] Rename bundled deployment file.
 */
program
  .command('build')
  .option('--app', 'Build an app.')
  .option('--vendor [params...]', 'List of files to put into @vendor.js.')
  .option('--min', 'Use the minified version for deployment.')
  .option('--no-transpile', 'Do not run tsc.')
  .option('--tsc [params]', 'Custom tsc params.')
  .option('--no-bundle', 'Do not run rollup.')
  .option('--rollup [params]', 'Custom rollup params.')
  .option('--no-minify', 'Do not run uglifyjs.')
  .option('--uglifyjs [params]', 'Custom uglifyjs params.')
  .option('--copy [value]', 'Resources to be copied, comma-seperated.')
  .option('--rename [value]', 'Rename bundled deployment file.')
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
 * Generate the documentation.
 * @name docs
 * @param {boolean?} [--no-api] Do not run typedoc.
 * @param {string?} [--typedoc] Custom typedoc params.
 */
program
  .command('docs')
  .option('--no-api', 'Do not run typedoc.')
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