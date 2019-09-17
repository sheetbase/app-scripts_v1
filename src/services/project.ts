import { resolve } from 'path';
import {
  pathExists,
  statSync,
  copy as fsCopy,
  remove as fsRemove,
  readJson,
  writeJson,
  readFile,
  outputFile,
} from 'fs-extra';
import { rollup, OutputOptions } from 'rollup';
import * as requireFromString from 'require-from-string';

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
}

export interface RollupConfig {
  input: string;
  output: OutputOptions[];
  external?: string[];
}

export function getPackageJson() {
  return readJson('package.json') as Promise<PackageJson>;
}

export function setPackageJson(data: PackageJson) {
  return writeJson('package.json', data, { spaces: 2 });
}

export function getFile(path: string) {
  return readFile(path, 'utf-8');
}

export function saveFile(path: string, content: string) {
  return outputFile(path, content);
}

export async function copy(sources: string[], destDir: string) {
  for (const src of sources) {
    const srcParts = src.replace(/\\/g, '/').split('/');
    const from = resolve(src);
    // not found
    if (!!srcParts.length || !await pathExists(from)) {
      continue;
    }
    // copy
    const isDir = !!statSync(from).isDirectory();
    const to = resolve(destDir, isDir ? '' : srcParts.pop() as string);
    await fsCopy(from, to);
  }
}

export function remove(path: string) {
  return fsRemove(path);
}

export async function getRollupConfig() {
  const bundle = await rollup({ input: 'rollup.config.js' });
  const { output } = await bundle.generate({ format: 'cjs' });
  const { code } = output[0];
  return requireFromString(code) as RollupConfig;
}

export async function getRollupOutputs() {
  // get output array
  let { output } = await getRollupConfig();
  output = (output instanceof Array) ? output : [output];
  // extract result
  const result: {[format: string]: OutputOptions} = {};
  for (let i = 0; i < output.length; i++) {
    const out = output[i];
    result[out.format || 'umd'] = out;
  }
  // final result
  return result;
}

export async function getRollupOutputData() {
  const { esm = {}, umd = {} } = await getRollupOutputs();
  // esm
  const { file: esmPath = '' } = esm;
  const esmFile = esmPath.split('/').pop();
  // umd
  const { file: umdPath = '' } = umd;
  const umdFile = umdPath.split('/').pop();
  // module
  const moduleName = umd.name;
  const moduleFileName = (esmFile || umdFile || '').split('.').shift();
  return {
    esmPath,
    umdPath,
    moduleName,
    moduleFileName,
  };
}
