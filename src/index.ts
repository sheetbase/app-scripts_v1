#!/usr/bin/env node

import { CLIApp } from './cli';

const cli = new CLIApp().getApp();

// show help
if (!process.argv.slice(2).length) {
  cli.outputHelp();
}

// execution
cli.parse(process.argv);
