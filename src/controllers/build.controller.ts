import chalk from 'chalk';
import { resolve, basename } from 'path';
import { remove, copy, outputFile, readJson, readFile, pathExists } from 'fs-extra';
import { snakeCase, paramCase, pascalCase, constantCase } from 'change-case';

import { SHEETBASE_MODULE_FILE_NAME } from '../services/code/code.config';
import { IBuildCodeInput } from '../services/code/code.type';
import { buildMain, buildIndex, buildDependenciesBundle, getPolyfill } from '../services/code/code.service';
import { getSheetbaseDependencies } from '../services/npm/npm.service';

export interface IOptions {
    param?: string;
    app?: boolean;
    vendor?: boolean;
    bundle?: boolean;
    polyfill?: boolean;
    init?: boolean;
}

export default async (nameExport: string = null, options: IOptions = {}) => {
    if (!nameExport) {
        const dotClaspDotJson = await readJson('.clasp.json');
        nameExport = dotClaspDotJson.exportName || basename(process.cwd());
    }
    const namePascalCase = pascalCase(nameExport);
    const nameSnakeCase = snakeCase(nameExport);
    const nameParamCase = paramCase(nameExport);
    const nameConstantCase = constantCase(nameExport);

    const type = options.app ? 'app': 'module';
    const src = resolve('.', 'src');
    const dist = resolve('.', 'dist');

    // build params
    const param: string = (options.param||'').split(',').map(x => x.trim()).join(', ');

    const buildData: IBuildCodeInput = {
        src, dist,
        names: {
            namePascalCase,
            nameParamCase,
            nameSnakeCase,
            nameConstantCase
        },
        type,
        param: param,
        vendor: options.vendor,
        bundle: options.bundle,
        init: options.init
    };
    
    // clean
    try {
        await remove(dist);
        await remove(SHEETBASE_MODULE_FILE_NAME);
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

        // @index.js
        const indexContent = await buildIndex(buildData);
        await outputFile(`${dist}/@index.js`, indexContent);

        // dependencies
        const dependencies: string[] = await getSheetbaseDependencies();
        if (options.bundle) {
            const modulesContent: string = await buildDependenciesBundle(dependencies);
            if (modulesContent) {
                await outputFile(`${dist}/@modules.js`, modulesContent);
            }
        } else {
            for (let i = 0; i < dependencies.length; i++) {
                const src = dependencies[i];
                const dest = src.replace('node_modules', '@modules')
                .replace('sheetbase.module.js', 'module.js');
                await copy(src, dist + '/' + dest);
            }
        }
        
        // polyfill
        if (type === 'app' && options.polyfill) {
            const POLYFILL: string = await getPolyfill();            
            if (options.bundle) {
                let modulesContent: string = POLYFILL;
                if (!! await pathExists(`${dist}/@modules.js`)) {
                    modulesContent = modulesContent + '\r\n\r\n' + await readFile(`${dist}/@modules.js`, 'utf-8')
                }
                await outputFile(`${dist}/@modules.js`, modulesContent);
            } else {
                await outputFile(`${dist}/@modules/@sheetbase/polyfill-server/module.js`, POLYFILL);
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