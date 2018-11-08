import { execSync } from 'child_process';
import { resolve } from 'path';
import { copy, pathExists, remove, outputFile, writeJson } from 'fs-extra';
import * as readDir from 'fs-readdir-recursive';

import { getRollupConfig, buildCodeExamples, buildDescription, getPackageJson } from '../services/content';
import { logError } from '../services/message';

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
    const SRC = resolve('.', 'src');
    const DIST = resolve('.', 'dist');
    const DEPLOY = resolve('.', 'deploy');

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
            const rollup = options.rollup || '-c';
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
        const { output: rollupConfigOutput } = await getRollupConfig(ROOT);
        const { file: rollupOutputFile } = rollupConfigOutput;
        const outputFileSplit = rollupOutputFile.split('/').filter(
            item => (!!item && item !== '.' && item !== '..'),
        );
        copies[outputFileSplit.pop()] = resolve(ROOT, ... outputFileSplit);
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

        // final touches
        if (options.app) {
            await remove(DIST);
        } else {
            // remove transpiled .js
            const files: string[] = readDir(DIST);
            for (let i = 0; i < files.length; i++) {
                const path = resolve(DIST, files[i]);
                if (
                    path.includes('.js') && !path.includes('bundles')
                ) {
                    await remove(path);
                }
            }

            // save .d.ts file
            const declarationFile = rollupOutputFile
                .replace('bundles/', '')
                .replace(
                    '.umd.js', '.d.ts',
                );
            await outputFile(resolve(ROOT, declarationFile),
                `export * from './public_api';`,
            );

            // add 'main' and 'typings' to package.json
            const packageJson = await getPackageJson();
            packageJson.main = rollupOutputFile;
            packageJson.typings = declarationFile;
            delete packageJson.gitUrl;
            delete packageJson.pageUrl;
            await writeJson(resolve(ROOT, 'package.json'), packageJson, { spaces: 3 });
        }

        console.log('\n');
    } catch (error) {
        return logError(error);
    }
    console.log('Build completed.');
    return process.exit();
}
