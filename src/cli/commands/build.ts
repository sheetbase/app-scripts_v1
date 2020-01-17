import { execSync } from 'child_process';
import { resolve } from 'path';

import {
  ProjectConfigs,
  OutputOptions,
  ProjectService,
  MessageService,
  RollupService,
  FileService,
} from '../../public-api';

export interface BuildOptions {
  copy?: string;
  vendor?: string;
}

export class BuildCommand {
  DIST_DIR = resolve('dist');
  DEPLOY_DIR = resolve('deploy');

  constructor(
    private fileService: FileService,
    private messageService: MessageService,
    private projectService: ProjectService,
    private rollupService: RollupService
  ) {}

  async run(options: BuildOptions) {
    const projectConfigs = await this.projectService.getConfigs();
    const { type, umdPath, typingsPath } = projectConfigs;
    // compile & bundle
    this.compileCode();
    await this.bundleCode(projectConfigs);
    // specific build
    if (type === 'module') {
      await this.buildModule(typingsPath as string);
    } else {
      const { copy = '', vendor = '' } = options;
      await this.buildApp(umdPath, copy, vendor);
    }
    // done
    return this.messageService.logOk(`Build ${type} completed.`);
  }

  compileCode() {
    return execSync(`npx tsc -p .`, { stdio: 'ignore' });
  }

  async bundleCode(configs: ProjectConfigs) {
    const { type, inputPath, umdPath, umdName, esmPath } = configs;
    // build output
    const output: OutputOptions[] = [
      // umd for both app & module
      {
        format: 'umd',
        file: umdPath,
        name: umdName,
        sourcemap: type === 'module',
      },
    ];
    // esm for module only
    if (type === 'module') {
      output.push({
        format: 'esm',
        sourcemap: true,
        file: esmPath,
      });
    }
    // bundle
    return this.rollupService.bundleCode(inputPath, output);
  }

  async buildModule(typingsPath: string) {
    this.moduleSaveTypings(typingsPath);
  }

  async moduleSaveTypings(typingsPath: string) {
    return this.fileService.outputFile(
      typingsPath,
      `export * from './src/public-api';`
    );
  }

  async buildApp(umdPath: string, copy: string, vendor: string) {
    // cleanup
    await this.fileService.remove(this.DEPLOY_DIR);
    // @index.js
    await this.appSaveIndex();
    // @app.js
    await this.appSaveMain(umdPath);
    // copy
    await this.appCopyResources(copy);
    // vendor
    await this.appSaveVendor(vendor);
    // remove the dist folder
    await this.fileService.remove(this.DIST_DIR);
  }

  async appSaveIndex() {
    return this.fileService.outputFile(
      resolve(this.DEPLOY_DIR, '@index.js'),
      '// A Sheetbase Application'
    );
  }

  async appSaveMain(mainPath: string) {
    const mainContent = await this.fileService.readFile(resolve(mainPath));
    const wwwSnippet = [
      'function doGet(e) { return Sheetbase.www().get(e); }',
      'function doPost(e) { return Sheetbase.www().post(e); }',
    ].join('\n');
    const content = mainContent + '\n\n' + wwwSnippet;
    return this.fileService.outputFile(
      resolve(this.DEPLOY_DIR, '@app.js'),
      content
    );
  }

  async appCopyResources(input: string) {
    const copies = ['.clasp.json', 'appsscript.json', 'src/views'];
    // extract copied path
    (input || '')
      .split(',')
      .forEach(item => !!item.trim() && copies.push(item.trim()));
    // save file
    return this.fileService.copy(copies, this.DEPLOY_DIR);
  }

  async appSaveVendor(input: string) {
    // extract vendor paths
    const vendors: string[] = [];
    (input || '')
      .split(',')
      .forEach(item => !!item.trim() && vendors.push(item.trim()));
    if (!!vendors.length) {
      // merge vendor code
      const contentArr: string[] = [];
      for (const vendor of vendors) {
        const path = vendor
          .replace('~', 'node_modules/')
          .replace('@', 'src/')
          .replace('//', '/');
        const content = await this.fileService.readFile(resolve(path));
        contentArr.push([`// ${path}`, content].join('\n'));
      }
      // save file
      return this.fileService.outputFile(
        resolve(this.DEPLOY_DIR, '@vendor.js'),
        contentArr.join('\n\n')
      );
    }
  }
}
