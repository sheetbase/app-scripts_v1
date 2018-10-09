import chalk from 'chalk';
import { resolve, basename } from 'path';
import { remove, ensureDir, copy, outputFile, readFile } from 'fs-extra';
import { snakeCase, paramCase, pascalCase, constantCase } from 'change-case';

import { SHEETBASE_MODULE_FILE_NAME } from '../services/code/code.config';
import { IBuildCodeInput } from '../services/code/code.type';
import { buildMain, buildIndex, buildDependenciesBundle, getPolyfill } from '../services/code/code.service';
import { packageJson, getSheetbaseDependencies } from '../services/npm/npm.service';

export interface IOptions {
    app?: boolean;
    vendor?: boolean;
    bundle?: boolean;
    ugly?: boolean;
}

export default async (nameExport: string = null, options: IOptions = {}) => {
    if (!nameExport) {
        const packageDotJson = await packageJson();
        nameExport = packageDotJson.exportName || basename(process.cwd());
    }
    const namePascalCase = pascalCase(nameExport);
    const nameSnakeCase = snakeCase(nameExport);
    const nameParamCase = paramCase(nameExport);
    const nameConstantCase = constantCase(nameExport);

    const type = options.app ? 'app': 'module';
    const src = resolve('.', 'src');
    const dist = resolve('.', 'dist');

    const buildData: IBuildCodeInput = {
        type, src, dist,
        names: {
            namePascalCase,
            nameParamCase,
            nameSnakeCase,
            nameConstantCase
        },
        vendor: options.vendor,
        bundle: options.bundle
    };
        
    // clean
    try {
        await remove(dist);
        await remove(SHEETBASE_MODULE_FILE_NAME);
        await ensureDir(dist);
    } catch (error) {
        console.log(chalk.red('Errors prepearing project.\n'));
        console.log(error);
        return process.exit(1);
    }

    // build & copy
    try {
        // main
        const mainCode = await buildMain(buildData);
        for (const path in mainCode) {
            const content = mainCode[path];
            await outputFile(path, content);
        }

        // index.js
        const indexContent = await buildIndex(buildData);
        await outputFile(`${dist}/@index.js`, indexContent);

        // dependencies
        const dependencies: string[] = await getSheetbaseDependencies();
        if (options.bundle) {
            const dependenciesBundle: string = await buildDependenciesBundle(dependencies);
            const gasContent: string = dependenciesBundle + '\r\n\r\n' + await readFile(`${dist}/${nameParamCase}.js`, 'utf-8');
            await outputFile(`${dist}/${nameParamCase}.js`, gasContent);
        } else {
            for (let i = 0; i < dependencies.length; i++) {
                const src = dependencies[i];
                const dest = src.replace('node_modules', '@modules')
                .replace('sheetbase.module.js', 'module.js');
                await copy(src, dist + '/' + dest);
            }
        }
        
        // polyfill
        if (type === 'app') {
            const POLYFILL: string = await getPolyfill();            
            if (options.bundle) {
                const gasContent: string = POLYFILL + '\r\n\r\n' + await readFile(`${dist}/${nameParamCase}.js`, 'utf-8');
                await outputFile(`${dist}/${nameParamCase}.js`, gasContent);
            } else {
                await outputFile(`${dist}/@modules/@polyfill.js`, POLYFILL);
            }
        }

        // meta
        await copy(`.clasp.json`, dist + '/.clasp.json');
        await copy(`appsscript.json`, dist + '/appsscript.json');
    } catch (error) {
        console.log(chalk.red('Errors building project.\n'));
        console.log(error);        
        return process.exit(1);
    }

    console.log(chalk.green('Build success!'));
    return process.exit();
}