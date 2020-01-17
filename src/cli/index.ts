import { red } from 'chalk';
import * as commander from 'commander';
import { AppscriptsModule } from '../public-api';

import { BuildCommand } from './commands/build';

export class Cli {
  private appscriptsModule: AppscriptsModule;

  buildCommand: BuildCommand;

  commander = [
    'sheetbase-app-scripts',
    'Scripts for Sheetbase backend modules and apps.'
  ];

  buildCommandDef: CommandDef = [
    'build',
    'Build distribution package.',
    ['--copy [value]', 'Copied resources, comma-seperated.'],
    ['--vendor [value]', 'Files for @vendor.js, comma-seperated.']
  ];

  constructor() {
    this.appscriptsModule = new AppscriptsModule();
    this.buildCommand = new BuildCommand(
      this.appscriptsModule.fileService,
      this.appscriptsModule.messageService,
      this.appscriptsModule.projectService,
      this.appscriptsModule.rollupService
    );
  }

  getApp() {
    commander
      .version(require('../../package.json').version, '-v, --version')
      .usage('sheetbase-app-scripts [options] [command]')
      .description('Scripts for Sheetbase backend modules and apps.');

    // build
    (() => {
      const [command, description, copyOpt, vendorOpt] = this.buildCommandDef;
      commander
        .command(command)
        .description(description)
        .option(...copyOpt) // --copy
        .option(...vendorOpt) // --vendor
        .action(options => this.buildCommand.run(options));
    })();

    // help
    commander
      .command('help')
      .description('Display help.')
      .action(() => commander.outputHelp());

    // *
    commander
      .command('*')
      .description('Any other command is not supported.')
      .action(cmd => console.error(red(`Unknown command '${cmd}'`)));

    return commander;
  }
}

type CommandDef = [string, string, ...Array<[string, string]>];
