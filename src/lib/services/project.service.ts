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
    const inputPath = type === 'app' ? './src/www.js' : './src/public-api.js';
    const iifePath = `./src/sheetbase-${type}.js`;
    const iifeName = type === 'app' ? 'App' : 'Module';
    return {
      type,
      name,
      fullName,
      inputPath,
      iifePath,
      iifeName,
    };
  }

  async getPackageJson() {
    return this.fileService.readJson('package.json') as Promise<PackageJson>;
  }
}
