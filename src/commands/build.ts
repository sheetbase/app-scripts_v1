import { EOL } from 'os';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { copy, pathExists, remove, readFile, outputFile, writeJson, renameSync } from 'fs-extra';

import {
    getPackageJson,
    getRollupOutputs,
    buildDescription,
    buildCodeExamples,
} from '../services/content';
import { logError, logSucceed } from '../services/message';

interface Options {
    app?: boolean;
    min?: boolean;
    vendor?: string;
    transpile?: boolean;
    tsc?: string;
    bundle?: boolean;
    rollup?: string;
    minify?: boolean;
    uglifyjs?: string;
    copy?: string;
    rename?: string;
}

export async function buildCommand(options: Options) {
    const ROOT = resolve('.');
    const SRC = resolve(ROOT, 'src');
    const DIST = resolve(ROOT, 'dist');
    const DEPLOY = resolve(ROOT, 'deploy');

    try {
        const { esm = {}, umd = {} } = await getRollupOutputs(ROOT);
        const esmFile = esm.file || '';
        const umdFile = umd.file || '';
        const umdFileSplit = umdFile.split('/').filter(
            item => (!!item && item !== '.' && item !== '..'),
        );
        const umdFileName = umdFileSplit.pop();
        const moduleFileName = umdFileName.replace('.umd.js', '');
        const deploymentFile = resolve(DEPLOY,
            !options.min ? umdFileName : umdFileName.replace('.js', '.min.js'),
        );

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

        // minify
        if (options.minify) {
            // tslint:disable-next-line:max-line-length
            const uglifyjs = options.uglifyjs || `${umdFile} --compress --mangle --comments --source-map -o ${umdFile.replace('.js', '.min.js')}`;
            execSync('uglifyjs ' + uglifyjs, { cwd: ROOT, stdio: 'ignore' });
        }

        /**
         * gas distribution
         */
        const copies = {
            '.clasp.json': ROOT,
            'appsscript.json': ROOT,
        };
        // main, rollup output
        if (options.min) {
            copies[umdFileName.replace('.js', '.min.js')] = resolve(ROOT, ... umdFileSplit);
        } else {
            copies[umdFileName] = resolve(ROOT, ... umdFileSplit);
        }
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
            const www = '' +
                'function doGet(e) { return App.Sheetbase.HTTP.get(e); }' + EOL +
                'function doPost(e) { return App.Sheetbase.HTTP.post(e); }';
            const content = (await readFile(deploymentFile, 'utf-8')) + EOL + www;
            await outputFile(deploymentFile, content);
        } else {
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

        // rename
        if (!!options.rename) {
            let newName = (typeof options.rename === 'string') ? options.rename :
                (options.app ? 'app' : 'module');
            newName = newName.replace('.js', '') + '.js';
            renameSync(deploymentFile, resolve(DEPLOY, newName));
        }

        // vendor
        if (options.vendor && typeof options.vendor === 'string') {
            const vendorItems = options.vendor.split(',').map(item => item.trim());
            let vendorContent = '';
            for (let i = 0; i < vendorItems.length; i++) {
                const file = vendorItems[i].replace('~', 'node_modules').replace('!', 'src');
                const content = await readFile(file, 'utf-8');
                vendorContent += (`// ${file}` + EOL + content + EOL.repeat(2));
            }
            await outputFile(resolve(DEPLOY, '@vendor.js'), vendorContent);
        }
    } catch (error) {
        return logError(error);
    }
    return logSucceed('Build completed.');
}
