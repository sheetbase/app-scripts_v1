import { execSync } from 'child_process';
import { resolve } from 'path';
import { copy, pathExists, remove, outputFile, writeJson } from 'fs-extra';

import { buildCodeExamples, buildDescription, getPackageJson, getRollupOutputs } from '../services/content';
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
            execSync('tsc ' + tsc, { cwd: ROOT, stdio: 'inherit' });
        }

        // bundle
        if (options.bundle) {
            const rollup = options.rollup || '-c --silent';
            execSync('rollup ' + rollup, { cwd: ROOT, stdio: 'inherit' });
        }

        /**
         * gas distribution
         */
        const copies = {
            '.clasp.json': ROOT,
            'appsscript.json': ROOT,
        };
        // main, rollup output
        const { umd } = await getRollupOutputs(ROOT);
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
        const description = await buildDescription();
        const examples = await buildCodeExamples();
        await outputFile(resolve(DEPLOY, '@index.js'), description + '\r\n' + examples);

        /**
         * final touches
         */
        const moduleFileName = umdFileName.replace('.umd.js', '');
        const mainFile = umdFile.replace('./', '');
        const moduleFile = 'dist/esm3/' + moduleFileName + '.js';
        const typingsFile = 'dist/' + moduleFileName + '.d.ts';

        // save proxy files
        const proxyContent =  `export * from './public_api';`;
        await outputFile(resolve(ROOT, moduleFile), proxyContent);
        await outputFile(resolve(ROOT, typingsFile), proxyContent);

        // add 'main', 'module' and 'typings' to package.json
        const packageJson = await getPackageJson();
        packageJson.main = mainFile;
        packageJson.module = moduleFile;
        packageJson.typings = typingsFile;
        delete packageJson.gitUrl;
        delete packageJson.pageUrl;
        await writeJson(resolve(ROOT, 'package.json'), packageJson, { spaces: 3 });

    } catch (error) {
        return logError(error);
    }
    return logSucceed('Build completed.');
}
