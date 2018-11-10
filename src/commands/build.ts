import { EOL } from 'os';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { copy, pathExists, remove, readFile, outputFile, writeJson } from 'fs-extra';

import {
    getPackageJson,
    getRollupOutputs,
    buildDescription,
    buildCodeExamples,
    getDotClaspJson,
} from '../services/content';
import { logError, logSucceed } from '../services/message';

interface Options {
    app?: boolean;
    transpile?: boolean;
    bundle?: boolean;
    tsc?: string;
    rollup?: string;
    copy?: string;
}

export async function buildCommand(options: Options) {
    const ROOT = resolve('.');
    const SRC = resolve(ROOT, 'src');
    const DIST = resolve(ROOT, 'dist');
    const DEPLOY = resolve(ROOT, 'deploy');

    try {
        // cleanup
        if (options.transpile || options.bundle) {
            await remove(DIST);
        }
        await remove(DEPLOY);

        // transpile
        if (options.transpile) {
            const tsc = options.tsc || '-p tsconfig.json';
            execSync('tsc ' + tsc, { cwd: ROOT, stdio: 'ignore' });
        }

        // bundle
        if (options.bundle) {
            const rollup = options.rollup || '-c --silent';
            execSync('rollup ' + rollup, { cwd: ROOT, stdio: 'ignore' });
        }

        /**
         * gas distribution
         */
        const copies = {
            '.clasp.json': ROOT,
            'appsscript.json': ROOT,
        };
        // main, rollup output
        const { esm, umd } = await getRollupOutputs(ROOT);
        const esmFile = esm.file;
        const umdFile = umd.file;
        const umdFileSplit = umdFile.split('/').filter(
            item => (!!item && item !== '.' && item !== '..'),
        );
        const umdFileName = umdFileSplit.pop();
        copies[umdFileName] = resolve(ROOT, ... umdFileSplit);
        // --copy
        let copyItems = (options.copy || '').split(',').map(item => item.trim());
        copyItems = [... copyItems, 'views'].filter(x => !!x);
        for (let i = 0; i < copyItems.length; i++) {
            copies[copyItems[i]] = SRC;
        }
        // run copy
        for (const item of Object.keys(copies)) {
            const src = resolve(copies[item], item);
            const dest = resolve(DEPLOY, item);
            if (!! await pathExists(src)) {
                await copy(src, dest);
            }
        }
        // @index.js
        let indexContent = '';
        if (options.app) {
            indexContent = '// A Sheetbase Application';
        } else {
            const description = await buildDescription();
            const examples = await buildCodeExamples();
            indexContent = description + EOL + examples;
        }
        await outputFile(resolve(DEPLOY, '@index.js'), indexContent);

        /**
         * finalize
         */
        if (options.app) {
            await remove(DIST);

            // add www snipet
            const bundlePath = resolve(DEPLOY, 'app.js');
            const www = '' +
                'function doGet(e) { return App.Sheetbase.HTTP.get(e); }' + EOL +
                'function doPost(e) { return App.Sheetbase.HTTP.post(e); }';
            const content = (await readFile(bundlePath, 'utf-8')) + EOL + www;
            await outputFile(bundlePath, content);
        } else {
            const moduleFileName = umdFileName.replace('.umd.js', '');
            const typingsFile = 'dist/' + moduleFileName + '.d.ts';
            const moduleTypingsFile = 'dist/esm3/' + moduleFileName + '.js';

            // save proxy files
            const typingsProxyContent =  `export * from './public_api';`;
            await outputFile(resolve(ROOT, moduleTypingsFile), typingsProxyContent);
            await outputFile(resolve(ROOT, typingsFile), typingsProxyContent);

            // add 'main', 'module' and 'typings' to package.json
            const packageJson = await getPackageJson();
            packageJson.main = umdFile.replace('./', '');
            packageJson.module = esmFile.replace('./', '');
            packageJson.typings = typingsFile;
            delete packageJson.gitUrl;
            delete packageJson.pageUrl;
            await writeJson(resolve(ROOT, 'package.json'), packageJson, { spaces: 3 });
        }

    } catch (error) {
        return logError(error);
    }
    return logSucceed('Build completed.');
}
