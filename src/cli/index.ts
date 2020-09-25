import {red} from 'chalk';
import {Command} from 'commander';
import {SheetbaseAppscriptsModule} from '../public-api';

import {BuildCommand} from './commands/build.command';
import {PushCommand} from './commands/push.command';

export class Cli {
  private sheetbaseAppscriptsModule: SheetbaseAppscriptsModule;

  buildCommand: BuildCommand;
  pushCommand: PushCommand;

  commander = [
    'sheetbase-app-scripts',
    'Scripts for Sheetbase backend modules and apps.',
  ];

  buildCommandDef: CommandDef = ['build', 'Build distribution package.'];

  pushCommandDef: CommandDef = [
    'push',
    'Push to the Apps Script server.',
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
    this.pushCommand = new PushCommand(
      this.sheetbaseAppscriptsModule.fileService,
      this.sheetbaseAppscriptsModule.messageService,
      this.sheetbaseAppscriptsModule.projectService
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
      const [command, description] = this.buildCommandDef;
      commander
        .command(command)
        .description(description)
        .action(() => this.buildCommand.run());
    })();

    // push
    (() => {
      const [command, description, copyOpt, vendorOpt] = this.pushCommandDef;
      commander
        .command(command)
        .description(description)
        .option(...copyOpt) // --copy
        .option(...vendorOpt) // --vendor
        .action(options => this.pushCommand.run(options));
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
