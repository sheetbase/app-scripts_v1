import chalk from 'chalk';
import { resolve, basename } from 'path';
import { remove, ensureDir, copy, outputFile } from 'fs-extra';
import { snakeCase, paramCase, pascalCase, constantCase } from 'change-case';

import { SHEETBASE_MODULE_FILE_NAME } from '../services/npm/npm.config';
import { IBuildCodeInput } from '../services/code/code.type';
import { buildMainSource, buildGASIndex, buildDependenciesBundle } from '../services/code/code.service';
import { getSheetbaseDependencies } from '../services/npm/npm.service';

export interface IOptions {
    app?: boolean;
    bundle?: boolean;
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
        bundle: options.bundle
    };

    // build
    await buildProject(buildData);

    console.log(chalk.green('Build success!'));
    return process.exit();
}

async function buildProject(buildData: IBuildCodeInput) {
    const { type, dist, names, bundle } = buildData;
    const { nameParamCase } = names;
    
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
        let { gas, npm } = await buildMainSource(buildData);
        const libIndex: string = await buildGASIndex(buildData);
        const dependencies: string[] = await getSheetbaseDependencies();

        // npm
        if (type === 'module') {
            await outputFile(SHEETBASE_MODULE_FILE_NAME, npm);
        }

        // gas
        await outputFile(`${dist}/${nameParamCase}.ts`, gas);
        await outputFile(`${dist}/@index.ts`, libIndex);
        await copy(`.clasp.json`, dist + '/.clasp.json');
        await copy(`appsscript.json`, dist + '/appsscript.json');
        // dependencies
        if (bundle) {
            const dependenciesBundle: string = await buildDependenciesBundle(dependencies);
            gas = dependenciesBundle + '\r\n\r\n' + gas;
            await outputFile(`${dist}/${nameParamCase}.ts`, gas);
        } else {
            for (let i = 0; i < dependencies.length; i++) {
                const src = dependencies[i];
                const dest = src.replace('node_modules', 'modules')
                                .replace('sheetbase.module.ts', 'module.ts');
                await copy(src, dist + '/' + dest);
            }
        }
    } catch (error) {
        console.log(chalk.red('Errors building project.\n'));
        console.log(error);        
        return process.exit(1);
    }

}