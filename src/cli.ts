import chalk from 'chalk';
import * as commander from 'commander';

import { FileService } from './services/file';
import { MessageService } from './services/message';
import { TypedocService } from './services/typedoc';
import { ProjectService } from './services/project';
import { RollupService } from './services/rollup';
import { ContentService } from './services/content';

import { BuildCommand } from './commands/build';
import { DocsCommand } from './commands/docs';

export class CLIApp {

  private fileService: FileService;
  private messageService: MessageService;
  private typedocService: TypedocService;
  private projectService: ProjectService;
  private rollupService: RollupService;
  private contentService: ContentService;

  private buildCommand: BuildCommand;
  private docsCommand: DocsCommand;

  constructor() {
    this.fileService = new FileService();
    this.messageService = new MessageService();
    this.typedocService = new TypedocService();
    this.projectService = new ProjectService(this.fileService);
    this.rollupService = new RollupService(this.projectService);
    this.contentService = new ContentService(this.fileService, this.typedocService);

    this.buildCommand = new BuildCommand(
      this.contentService,
      this.fileService,
      this.messageService,
      this.projectService,
      this.rollupService,
    );
    this.docsCommand = new DocsCommand(
      this.contentService,
      this.fileService,
      this.messageService,
      this.projectService,
      this.typedocService,
    );
  }
  
  getApp() {
    commander
      .version(require('../package.json').version, '-v, --version')
      .usage('sheetbase-app-scripts [options] [command]')
      .description('Scripts for Sheetbase backend modules and apps.');
  
    commander
      .command('build')
      .description('Build distribution package.')
      .option('--copy [value]', 'Copied resources, comma-seperated.')
      .option('--vendor [value]', 'Files for @vendor.js, comma-seperated.')
      .action(options => this.buildCommand.build(options));
  
    commander
      .command('docs')
      .description('Generate the documentation.')
      .action(() => this.docsCommand.docs());
  
    commander
      .command('help')
      .description('Display help.')
      .action(() => commander.outputHelp());
  
    commander
      .command('*')
      .description('Any other command is not supported.')
      .action(cmd => console.error(chalk.red(`Unknown command '${cmd}'`)));
  
    return commander;
  }

}
