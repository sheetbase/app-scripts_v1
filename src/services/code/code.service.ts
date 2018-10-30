import { readFile, copy } from 'fs-extra';
import { format } from 'prettier';
import axios from 'axios';
const readDir = require('fs-readdir-recursive');
const ts2gas = require('ts2gas');

import { BuildCodeInput } from './code.type';
import { packageJson } from '../npm/npm.service';
import {
    BUILD_MAIN_CODE_IGNORE,
    SHEETBASE_MODULE_FILE_NAME,
    POLYFILL_FILE_URL,
    DEFAULT_COPIES,
} from './code.config';

export async function buildDescriptionContent(buildData: BuildCodeInput): Promise<string> {
    const { type, names } = buildData;
    const { namePascalCase } = names;
    const { name, description, version, author, homepage, license, repository } = await packageJson();
    let content = '\r\n';
    content += '/**';
    if (type) { content += `\r\n* Sheetbase ${type}`; }
    if (name) { content += `\r\n* Name: ${name}`; }
    if (namePascalCase) { content += `\r\n* Export name: ${namePascalCase}`; }
    if (description) { content += `\r\n* Description: ${description}`; }
    if (version) { content += `\r\n* Version: ${version}`; }
    if (author) { content += `\r\n* Author: ${author}`; }
    if (homepage || repository) { content += `\r\n* Homepage: ${homepage || repository.url}`; }
    if (license) { content += `\r\n* License: ${license}`; }
    if (repository) { content += `\r\n* Repo: ${repository.url}`; }
    content += '\r\n*/';
    return format(content, { parser: 'typescript' });
}

export async function buildMain(buildData: BuildCodeInput): Promise<{[key: string]: string}> {
    const { src, dist, names, type, vendor, init, params } = buildData;
    const { namePascalCase, nameParamCase } = names;

    // read index.ts
    let indexContent = '';
    try {
        indexContent = await readFile(`${src}/index.ts`, 'utf-8');
        if (vendor) {
            indexContent = ts2gas(indexContent)
                            .replace(/var\ exports\ [^\n]*/g, '')
                            .replace(/var\ module\ [^\n]*/g, '')
                            .trim();
        }
    } catch (error) {
        /* no "src/index.ts" */
    }

    // read global.ts
    let globalContent = '';
    try {
        globalContent = await readFile(`${src}/global.ts`, 'utf-8');
        if (vendor) {
            globalContent = ts2gas(globalContent)
                            .replace(/var\ exports\ [^\n]*/g, '')
                            .replace(/var\ module\ [^\n]*/g, '')
                            .trim();
        }
        globalContent = '// code from global.ts\r\n' + globalContent;
    } catch (error) {
        /* no "src/global.ts" */
    }

    // read configs (sheetbase.config.ts or config.ts)
    let configContent = '';
    try {
        configContent += await readFile(`${src}/sheetbase.config.ts`, 'utf-8');
        configContent = '// code from sheetbase.config.ts\r\n' + configContent;
    } catch (error) {
        /* no src/sheetbase.config.ts */
    }
    try {
        configContent += await readFile(`${src}/config.ts`, 'utf-8');
        configContent = '// code from config.ts\r\n' + configContent;
    } catch (error) {
        /* no src/config.ts */
    }

    // read all except files or folders in BUILD_MAIN_CODE_IGNORE
    let files: string[];
    const filesContent: string[] = [];
    files = readDir(src, (name, index, dir) => {
        const path: string = (dir as string + '/' + name).replace(src, '');
        const ignore = new RegExp([... BUILD_MAIN_CODE_IGNORE, ... DEFAULT_COPIES].join('|'), 'g');
        return !ignore.test(path);
    });
    for (let i = 0; i < files.length; i++) {
        const path = `${src}/${files[i]}`;
        const content: string = await readFile(path, 'utf-8');
        filesContent.push(content);
    }

    // build description
    const fileDescription: string = await buildDescriptionContent(buildData);

    // main content
    let mainContent: string = (configContent + '\r\n' +
                                filesContent.join('\r\n') + '\r\n' +
                                indexContent
                            ).trim();
    if (type !== 'app' && !vendor) {
        mainContent = `{
            ${configContent}
            ${filesContent.join('\r\n')}
            ${indexContent}
            return moduleExports || {};
        }`;
        mainContent = mainContent.replace(/(export\ )/g, '');
        mainContent = `export function ${namePascalCase}Module(${params || ''}) ` +  mainContent;
    }

    // extra
    const npmExtra = init ? `
        // add '${namePascalCase}' to the global namespace
        ((process) => {
            process['${namePascalCase}'] = ${namePascalCase}Module();
        })(this);
    ` : '';
    const gasExtra = init ? `
        // add exports to the global namespace
        ((process) => {
            const ${namePascalCase} = ${namePascalCase}Module();
            for (const prop of Object.keys({
                ... ${namePascalCase},
                ... Object.getPrototypeOf(${namePascalCase})
            })) {
                process[prop] = ${namePascalCase}[prop];
            }
        })(this);
    ` : '';

    // outputs
    let npmOutput = '';
    let gasOutput = '';
    gasOutput = mainContent;
    if (type !== 'app') {
        npmOutput = fileDescription + '\r\n' + mainContent;
    }

    // extra
    if (type !== 'app' && !vendor) {
        npmOutput = npmOutput + '\r\n' + npmExtra;
        gasOutput = gasOutput + '\r\n' + gasExtra;
    }

    // compile
    if (vendor) {
        const PLACEHOLDER_PHASE = '/**_SHEETBASE_MODULE_VENDOR_CONTENT_HERE_*/';
        const npmExtraCompiled: string = ts2gas(
            PLACEHOLDER_PHASE + npmExtra,
        );
        const gasExtraCompiled: string = ts2gas(
            PLACEHOLDER_PHASE + gasExtra,
        );
        const npmExtraCompiledSplits = npmExtraCompiled.split(PLACEHOLDER_PHASE);
        const gasExtraCompiledSplits = gasExtraCompiled.split(PLACEHOLDER_PHASE);
        npmOutput = npmExtraCompiledSplits[0] + npmOutput + npmExtraCompiledSplits[1] + globalContent;
        gasOutput = gasExtraCompiledSplits[0] + gasOutput + gasExtraCompiledSplits[1] + globalContent;
    } else {
        // global
        npmOutput = npmOutput + '\r\n' + globalContent;
        gasOutput = gasOutput + '\r\n' + globalContent;
        npmOutput = ts2gas(npmOutput);
        gasOutput = ts2gas(gasOutput);
    }

    // results
    const result: any = {};
    result[`${dist}/${nameParamCase}.js`] = gasOutput;
    if (type !== 'app') {
        result[`${SHEETBASE_MODULE_FILE_NAME}`] = npmOutput;
    }

    return result;
}

export async function buildIndex(data: BuildCodeInput): Promise<string> {
    const { src, names } = data;
    const { nameSnakeCase } = names;
    // read "src/example.ts"
    let exampleContent = '';
    try {
        exampleContent = await readFile(`${src}/example.ts`, 'utf-8');
        exampleContent = exampleContent.replace(/(export function\ )/g, `export function ${nameSnakeCase}_`);
    } catch (error) {
        /* no "src/example.ts" */
    }
    // get description
    const fileDescription: string = await buildDescriptionContent(data);
    // sum up
    let indexOutput = `
        ${fileDescription}
        ${exampleContent}
    `;
    // compile
    indexOutput = ts2gas(indexOutput);
    return indexOutput;
}

export async function buildDependenciesBundle(dependencies: string[]): Promise<string> {
    const filesContent: string[] = [];
    for (let i = 0; i < dependencies.length; i++) {
        const path = `${dependencies[i]}`;
        const content: string = await readFile(path, 'utf-8');
        filesContent.push(content);
    }
    return filesContent.join('\r\n\r\n');
}

export async function getPolyfill(): Promise<string> {
    const { data } = await axios.get(POLYFILL_FILE_URL);
    return data;
}

export async function copyContent(data: BuildCodeInput): Promise<void> {
    const { src, dist } = data;
    let { copies } = data;
    copies = copies.concat(DEFAULT_COPIES).filter(x => !!x);
    for (let i = 0; i < copies.length; i++) {
        const item = copies[i];
        try {
            await copy(`${src}/${item}`, `${dist}/${item}`);
        } catch (error) {
            /** no files or folders */
        }
    }
}