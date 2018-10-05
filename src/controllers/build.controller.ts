import chalk from 'chalk';
import { resolve, basename } from 'path';
import { remove, ensureDir, copy, outputFile, readFile } from 'fs-extra';
import { snakeCase, paramCase, pascalCase, constantCase } from 'change-case';

import { SHEETBASE_MODULE_FILE_NAME } from '../services/code/code.config';
import { IBuildCodeInput } from '../services/code/code.type';
import { buildCode, buildDependenciesBundle, getPolyfill } from '../services/code/code.service';
import { getSheetbaseDependencies } from '../services/npm/npm.service';

export interface IOptions {
    app?: boolean;
    bundle?: boolean;
    vendor?: boolean;
}

export default async (name: string = null, options: IOptions = {}) => {
    name = name || basename(process.cwd());
    const namePascalCase = pascalCase(name);
    const nameSnakeCase = snakeCase(name);
    const nameParamCase = paramCase(name);
    const nameConstantCase = constantCase(name);

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
        bundle: options.bundle,
        vendor: options.vendor
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
        // code
        const code = await buildCode(buildData);
        for (const path in code) {
            const content = code[path];
            await outputFile(path, content);
        }

        // dependencies
        const dependencies: string[] = await getSheetbaseDependencies();
        if (options.bundle) {
            const dependenciesBundle: string = await buildDependenciesBundle(dependencies);
            const gasContent: string = dependenciesBundle + '\r\n\r\n' + await readFile(`${dist}/${nameParamCase}.ts`, 'utf-8');
            await outputFile(`${dist}/${nameParamCase}.ts`, gasContent);
        } else {
            for (let i = 0; i < dependencies.length; i++) {
                const src = dependencies[i];
                const dest = src.replace('node_modules', '@modules')
                .replace('sheetbase.module.ts', 'module.ts');
                await copy(src, dist + '/' + dest);
            }
        }
        
        // polyfill
        if (type === 'app') {
            const POLYFILL: string = await getPolyfill();            
            if (options.bundle) {
                const gasContent: string = POLYFILL + '\r\n\r\n' + await readFile(`${dist}/${nameParamCase}.ts`, 'utf-8');
                await outputFile(`${dist}/${nameParamCase}.ts`, gasContent);
            } else {
                await outputFile(`${dist}/@modules/@polyfill.ts`, POLYFILL);
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