import { execSync } from 'child_process';
import { resolve } from 'path';
import { copy, pathExists, remove, outputFile } from 'fs-extra';

import { getRollupConfig, buildCodeExamples, buildDescription } from '../services/content';
import { logError } from '../services/message';

interface Options {
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
        /**
         * cleanup
         */
        if (options.transpile || options.bundle) {
            await remove(DIST);
        }
        await remove(DEPLOY);

        /**
         * transpile
         */
        if (options.transpile) {
            const tsc = options.tsc || '-p tsconfig.json';
            execSync('tsc ' + tsc, { cwd: ROOT, stdio: 'inherit' });
        }

        /**
         * bundle
         */
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
        // main
        const { output: rollupConfigOutput } = await getRollupConfig(ROOT);
        const outputPathSplit = rollupConfigOutput.file.split('/').filter(
            item => (!!item && item !== '.' && item !== '..'),
        );
        copies[outputPathSplit.pop()] = resolve(ROOT, ... outputPathSplit);
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
        // example.js
        const examples = await buildCodeExamples();
        await outputFile(resolve(DEPLOY, 'example.js'), examples);
        // @index.js
        const description = await buildDescription();
        await outputFile(resolve(DEPLOY, '@index.js'), description);
    } catch (error) {
        return logError(error);
    }
    console.log('Build completed.');
    return process.exit();
}
