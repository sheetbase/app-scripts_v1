import { resolve } from 'path';
import {
  pathExists,
  statSync,
  readJson,
  copy as fsCopy,
  remove as fsRemove,
  readFile as fsReadFile,
  outputFile as fsOutputFile,
} from 'fs-extra';

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

export async function getConfigs(): Promise<ProjectConfigs> {
  const { name: pkgName } = await getPackageJson();
  const type =
    pkgName === '@sheetbase/backend' || pkgName.indexOf('@app') !== -1
      ? 'app'
      : 'module';
  const name = pkgName.split('/').pop() as string; // ex.: server
  const fullName = pkgName.replace('@', '').replace('/', '-'); //ex.: sheetbase-server
  if (type === 'app') {
    const inputPath = './dist/index.js';
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
    const inputPath = './dist/esm3/public-api.js';
    const umdPath = `./dist/bundles/${fullName}.js`;
    const umdName = name.charAt(0).toUpperCase() + name.slice(1);
    const esmPath = `./dist/fesm3/${fullName}.js`;
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
// export async function getConfigs(): Promise<ProjectConfigs> {
//   const { umd = {} } = await getRollupOutputs();
//   const exportName = umd.name;
//   const mainPath = umd.file;
//   const mainFile = (mainPath || '').split('/').pop();
//   const fileName = (mainFile || '').split('.').shift();
//   return {
//     exportName,
//     mainPath,
//     mainFile,
//     fileName,
//   };
// }

export function getPackageJson() {
  return readJson('package.json') as Promise<PackageJson>;
}

export function readFile(path: string) {
  return fsReadFile(path, 'utf-8');
}

export function outputFile(path: string, content: string) {
  return fsOutputFile(path, content);
}

export async function copy(sources: string[], destDir: string) {
  for (const src of sources) {
    const srcParts = src.replace(/\\/g, '/').split('/');
    const from = resolve(src);
    // not found
    if (!!srcParts.length || !(await pathExists(from))) {
      continue;
    }
    // copy
    const isDir = !!statSync(from).isDirectory();
    const to = resolve(destDir, isDir ? '' : (srcParts.pop() as string));
    await fsCopy(from, to);
  }
}

export function remove(path: string) {
  return fsRemove(path);
}
