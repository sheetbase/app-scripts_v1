import {execSync} from 'child_process';

import {
  ProjectConfigs,
  OutputOptions,
  FileService,
  ProjectService,
  MessageService,
  RollupService,
} from '../../public-api';

export class BuildCommand {
  constructor(
    private fileService: FileService,
    private messageService: MessageService,
    private projectService: ProjectService,
    private rollupService: RollupService
  ) {}

  async run() {
    const projectConfigs = await this.projectService.getConfigs();
    const {type, iifePath} = projectConfigs;
    // compile
    this.compileCode();
    // bundle
    await this.bundleCode(projectConfigs);
    // specific for app
    if (type === 'app') {
      const iifeContent = await this.fileService.readFile(iifePath);
      const wwwSnippet = [
        'function doGet(e) { return App.Server.www().get(e); }',
        'function doPost(e) { return App.Server.www().post(e); }',
      ].join('\n');
      this.fileService.outputFile(iifePath, iifeContent + '\n' + wwwSnippet);
    }
    // done
    return this.messageService.logOk(
      `Build ${type} completed, you may now push to the server.`
    );
  }

  private compileCode() {
    return execSync('npx tsc', {stdio: 'ignore'});
  }

  private async bundleCode(configs: ProjectConfigs) {
    const {inputPath, iifePath, iifeName} = configs;
    // build output
    const output: OutputOptions[] = [
      {
        format: 'iife',
        file: iifePath,
        name: iifeName,
        exports: 'named',
      },
    ];
    // bundle
    return this.rollupService.bundleCode(inputPath, output);
  }
}
