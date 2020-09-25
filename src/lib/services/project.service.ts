import {FileService} from './file.service';

export interface PackageJson {
  name: string;
  version: string;
  description: string;
  main: string;
  module: string;
  typings: string;
  author: string;
  homepage: string;
  license: string;
  scripts: {[key: string]: string};
  keywords: string[];
  repository: {
    type: string;
    url: string;
  };
  bugs: {
    url: string;
  };
  dependencies: {[key: string]: string};
  devDependencies: {[key: string]: string};
  peerDependencies: {[key: string]: string};
  // custom rollup plugin configs
  rollup?: {
    resolve?: {};
    commonjs?: {};
  };
}

export interface ProjectConfigs {
  type: 'app' | 'module';
  name: string;
  fullName: string;
  inputPath: string;
  iifePath: string;
  iifeName: string;
  esmPath?: string;
}

export class ProjectService {
  constructor(private fileService: FileService) {}

  async getConfigs(): Promise<ProjectConfigs> {
    const {name: pkgName} = await this.getPackageJson();
    const type =
      pkgName === '@sheetbase/backend' || pkgName.indexOf('@app') !== -1
        ? 'app'
        : 'module';
    const name = pkgName.split('/').pop() as string; // ex.: server
    const fullName = pkgName.replace('@', '').replace('/', '-'); //ex.: sheetbase-server
    if (type === 'app') {
      const inputPath = './src/www.js';
      const iifePath = './src/sheetbase-app.js';
      const iifeName = 'App';
      return {
        type,
        name,
        fullName,
        inputPath,
        iifePath,
        iifeName,
      };
    } else {
      const inputPath = './src/public-api.js';
      const esmPath = './src/sheetbase-module.esm.js';
      const iifePath = './src/sheetbase-module.js';
      const iifeName = 'Module';
      return {
        type,
        name,
        fullName,
        inputPath,
        iifePath,
        iifeName,
        esmPath,
      };
    }
  }

  async getPackageJson() {
    return this.fileService.readJson('package.json') as Promise<PackageJson>;
  }
}
