#!/usr/bin/env node

/**
 * Scripts for Sheetbase modules and apps.
 */

import { cli } from './cli';

const cliApp = cli();

// show help
if (!process.argv.slice(2).length) {
  cliApp.outputHelp();
}

// running
cliApp.parse(process.argv);
