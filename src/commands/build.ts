import { EOL } from 'os';
import { execSync } from 'child_process';
import { resolve } from 'path';

import {
  getPackageJson,
  setPackageJson,
  getFile,
  saveFile,
  copy,
  remove,
  getRollupOutputData,
} from '../services/project';
import { logOk } from '../services/message';

interface Options {
  module?: boolean;
  tsc?: string;
  rollup?: string;
  copy?: string;
  vendor?: string;
}

export async function buildCommand(options: Options) {
  const DIST_DIR = resolve('dist');
  const DEPLOY_DIR = resolve('deploy');

  // prepare
  const { esmPath, umdPath, moduleFileName } = await getRollupOutputData();

  // cleanup
  if (!!options.module) {
    await remove(DIST_DIR);
  } else {
    await remove(DEPLOY_DIR);
  }

  // transpile
  const tscArgs = options.tsc || '-p tsconfig.json';
  execSync(`tsc ${tscArgs}`, { stdio: 'ignore' });

  // bundle
  const rollupArgs = options.rollup || '-c';
  execSync(`rollup ${rollupArgs}`, { stdio: 'ignore' });

  // specific build
  if (!!options.module) {
    const typingsPath = `dist/${moduleFileName}.d.ts`;
    // save typing proxy file
    await saveFile(resolve(typingsPath), `export * from './public-api';`);
    // add 'main', 'module' and 'typings' to package.json
    const packageJson = await getPackageJson();
    packageJson.main = umdPath.replace('./', '');
    packageJson.module = esmPath.replace('./', '');
    packageJson.typings = typingsPath;
    await setPackageJson(packageJson);
  } else {
    // @index.js
    await saveFile(
      resolve(DEPLOY_DIR, '@index.js'),
      '// A Sheetbase Application'
    );
    // @app.js
    const content = await getFile(umdPath);
    const www =
      '' +
      EOL +
      'function doGet(e) { return App.Sheetbase.HTTP.get(e); }' +
      EOL +
      'function doPost(e) { return App.Sheetbase.HTTP.post(e); }' +
      EOL;
    await saveFile(resolve(DEPLOY_DIR, '@app.js'), content + www);
    // copy files & folders
    const copies = ['.clasp.json', 'appsscript.json', 'src/views'];
    (options.copy || '')
      .split(',')
      .map(item => !!item && copies.push(item.trim()));
    await copy(copies, DEPLOY_DIR);
    // remove the dist folder
    await remove(DIST_DIR);
  }

  // vendor
  if (options.vendor && typeof options.vendor === 'string') {
    const vendors = options.vendor.split(',').map(item => item.trim());
    let content = '';
    for (let i = 0; i < vendors.length; i++) {
      const path = vendors[i].replace('~', 'node_modules').replace('!', 'src');
      const vendorContent = await getFile(resolve(path));
      content += `// ${path}` + EOL + vendorContent + EOL.repeat(2);
    }
    await saveFile(resolve(DEPLOY_DIR, '@vendor.js'), content);
  }

  return logOk('Build completed.');
}
