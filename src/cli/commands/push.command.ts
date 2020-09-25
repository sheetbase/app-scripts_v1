import {pathExists} from 'fs-extra';
import {resolve} from 'path';
import {execSync} from 'child_process';

import {ProjectService, MessageService, FileService} from '../../public-api';

export interface PushOptions {
  copy?: string;
  vendor?: string;
}

export class PushCommand {
  DEPLOY_DIR = '.deploy';

  constructor(
    private fileService: FileService,
    private messageService: MessageService,
    private projectService: ProjectService
  ) {}

  async run(options: PushOptions) {
    const projectConfigs = await this.projectService.getConfigs();
    const {iifePath} = projectConfigs;
    // check if built content available
    if (!(await pathExists(iifePath))) {
      return this.messageService.logError(
        'No resource for pushing, please build first.'
      );
    } else {
      // copy resource to /.deploy
      await this.staging(iifePath, options);
      // push using CLASP
      this.pushing();
      // remove /.deploy
      await this.cleanup();
      // done
      return this.messageService.logOk('Resource was pushed.');
    }
  }

  private async staging(iifePath: string, pushOptions: PushOptions) {
    // copy the main file
    await this.fileService.copy([iifePath], this.DEPLOY_DIR);
    // additional options
    const {copy = '', vendor = ''} = pushOptions;
    // copy
    await this.copyResources(copy);
    // vendor
    await this.saveVendor(vendor);
  }

  private pushing() {
    return execSync('clasp push', {stdio: 'inherit'});
  }

  private cleanup() {
    return this.fileService.remove(this.DEPLOY_DIR);
  }

  private async copyResources(input: string) {
    const copies = ['appsscript.json', 'src/views'];
    // extract copied path
    (input || '')
      .split(',')
      .forEach(item => !!item.trim() && copies.push(item.trim()));
    // save file
    return this.fileService.copy(copies, this.DEPLOY_DIR);
  }

  private async saveVendor(input: string) {
    // extract vendor paths
    const vendors: string[] = [];
    (input || '')
      .split(',')
      .forEach(item => !!item.trim() && vendors.push(item.trim()));
    if (vendors.length) {
      // merge vendor code
      const contentArr: string[] = [];
      for (const vendor of vendors) {
        const path = vendor
          .replace('~', 'node_modules/')
          .replace('@', 'src/')
          .replace('//', '/');
        const content = await this.fileService.readFile(path);
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
