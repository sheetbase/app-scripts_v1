import { FileService } from './file';

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
  scripts: { [key: string]: string };
  keywords: string[];
  repository: {
    type: string;
    url: string;
  };
  bugs: {
    url: string;
  };
  dependencies: { [key: string]: string };
  devDependencies: { [key: string]: string };
  peerDependencies: { [key: string]: string };
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
  umdPath: string;
  umdName: string;
  esmPath?: string;
  typingsPath?: string;
}

export class ProjectService {

  constructor(private fileService: FileService) {}

  async getConfigs(): Promise<ProjectConfigs> {
    const { name: pkgName } = await this.getPackageJson();
    const type =
      pkgName === '@sheetbase/backend' || pkgName.indexOf('@app') !== -1
        ? 'app'
        : 'module';
    const name = pkgName.split('/').pop() as string; // ex.: server
    const fullName = pkgName.replace('@', '').replace('/', '-'); //ex.: sheetbase-server
    if (type === 'app') {
      const inputPath = './dist/src/index.js';
      const umdPath = './dist/app.js';
      const umdName = 'App';
      return {
        type,
        name,
        fullName,
        inputPath,
        umdPath,
        umdName,
      };
    } else {
      const inputPath = './dist/src/public-api.js';
      const umdPath = `./dist/${fullName}.js`;
      const umdName = name.charAt(0).toUpperCase() + name.slice(1);
      const esmPath = `./dist/${fullName}.esm.js`;
      const typingsPath = `./dist/${fullName}.d.ts`;
      return {
        type,
        name,
        fullName,
        inputPath,
        umdPath,
        umdName,
        esmPath,
        typingsPath,
      };
    }
  }

  async getPackageJson() {
    return this.fileService.readJson('package.json') as Promise<PackageJson>;
  }
}
