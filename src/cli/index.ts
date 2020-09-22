import {red} from 'chalk';
import {Command} from 'commander';
import {SheetbaseAppscriptsModule} from '../public-api';

import {BuildCommand} from './commands/build.command';

export class Cli {
  private sheetbaseAppscriptsModule: SheetbaseAppscriptsModule;

  buildCommand: BuildCommand;

  commander = [
    'sheetbase-app-scripts',
    'Scripts for Sheetbase backend modules and apps.',
  ];

  buildCommandDef: CommandDef = [
    'build',
    'Build distribution package.',
    ['--copy [value]', 'Copied resources, comma-seperated.'],
    ['--vendor [value]', 'Files for @vendor.js, comma-seperated.'],
  ];

  constructor() {
    this.sheetbaseAppscriptsModule = new SheetbaseAppscriptsModule();
    this.buildCommand = new BuildCommand(
      this.sheetbaseAppscriptsModule.fileService,
      this.sheetbaseAppscriptsModule.messageService,
      this.sheetbaseAppscriptsModule.projectService,
      this.sheetbaseAppscriptsModule.rollupService
    );
  }

  getApp() {
    const commander = new Command();

    // general
    const [command, description] = this.commander;
    commander
      .version(require('../../package.json').version, '-v, --version')
      .name(`${command}`)
      .usage('[options] [command]')
      .description(description);

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
      .action(cmd => console.error(red(`Unknown command '${cmd.args[0]}'`)));

    return commander;
  }
}

type CommandDef = [string, string, ...Array<[string, string]>];
