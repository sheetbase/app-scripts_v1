import { resolve } from 'path';
import { execSync } from 'child_process';

import {
  OutputOptions,
  bundleCode as rollupBundleCode,
} from '../services/rollup';
import {
  ProjectConfigs,
  getConfigs,
  copy,
  remove,
  readFile,
  outputFile,
} from '../services/project';
import { EOL, EOL2X } from '../services/content';
import { logOk } from '../services/message';

interface Options {
  copy?: string;
  vendor?: string;
}

const DIST_DIR = resolve('dist');
const DEPLOY_DIR = resolve('deploy');

export async function buildCommand(options: Options) {
  const projectConfigs = await getConfigs();
  const { type, umdPath, typingsPath } = projectConfigs;
  // validation
  if (!umdPath || !typingsPath) {
    throw new Error('Invalid project.');
  }
  // compile & bundle
  await compileCode();
  await bundleCode(projectConfigs);
  // specific build
  if (type === 'module') {
    await buildModule(typingsPath);
  } else {
    const { copy = '', vendor = '' } = options;
    await buildApp(umdPath, copy, vendor);
  }
  // done
  return logOk(`Build ${type} completed.`);
}

async function compileCode() {
  return execSync(`tsc -p tsconfig.json`, { stdio: 'ignore' });
}

async function bundleCode(configs: ProjectConfigs) {
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
  return rollupBundleCode(inputPath, output);
}

async function buildModule(typingsPath: string) {
  moduleSaveTypings(typingsPath);
}

async function moduleSaveTypings(typingsPath: string) {
  return outputFile(typingsPath, `export * from './public-api';`);
}

async function buildApp(umdPath: string, copy: string, vendor: string) {
  // cleanup
  await remove(DEPLOY_DIR);
  // @index.js
  await appSaveIndex();
  // @app.js
  await appSaveMain(umdPath);
  // copy
  await appCopyResources(copy);
  // vendor
  await appSaveVendor(vendor);
  // remove the dist folder
  await remove(DIST_DIR);
}

async function appSaveIndex() {
  return outputFile(
    resolve(DEPLOY_DIR, '@index.js'),
    '// A Sheetbase Application'
  );
}

async function appSaveMain(mainPath: string) {
  const mainContent = await readFile(mainPath);
  const wwwSnippet = [
    'function doGet(e) { return App.Sheetbase.HTTP.get(e); }',
    'function doPost(e) { return App.Sheetbase.HTTP.post(e); }',
  ].join(EOL);
  const content = mainContent + EOL2X + wwwSnippet;
  return outputFile(resolve(DEPLOY_DIR, '@app.js'), content);
}

async function appCopyResources(input: string) {
  const copies = ['.clasp.json', 'appsscript.json', 'src/views'];
  (input || '').split(',').forEach(item => !!item && copies.push(item.trim()));
  return copy(copies, DEPLOY_DIR);
}

async function appSaveVendor(input: string) {
  const vendors = (input || '').split(',').map(item => item.trim());
  // merge vendor code
  const contentArr = [];
  for (const vendor of vendors) {
    const path = vendor.replace('~', 'node_modules').replace('!', 'src');
    const content = await readFile(path);
    contentArr.push([`// ${path}`, content].join(EOL));
  }
  // save file
  return !input
    ? null
    : outputFile(resolve(DEPLOY_DIR, '@vendor.js'), contentArr.join(EOL2X));
}
