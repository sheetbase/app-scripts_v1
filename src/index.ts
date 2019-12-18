#!/usr/bin/env node

import { Cli } from './cli/index';

const cliApp = new Cli().getApp();

// show help
if (!process.argv.slice(2).length) {
  cliApp.outputHelp();
}

// execution
cliApp.parse(process.argv);
