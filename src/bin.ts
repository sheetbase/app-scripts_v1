#!/usr/bin/env node
import {Cli} from './cli/index';

const cliApp = new Cli().getApp();
cliApp.parse(process.argv);
