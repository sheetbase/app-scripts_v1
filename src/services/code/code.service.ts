import { readFile } from 'fs-extra';
import { format } from 'prettier';
import axios from 'axios';
const readDir = require('fs-readdir-recursive');
const ts2gas = require('ts2gas');

import { IBuildCodeInput } from './code.type';
import { packageJson } from '../npm/npm.service';
import { BUILD_MAIN_CODE_IGNORE, SHEETBASE_MODULE_FILE_NAME, POLYFILL_FILE_URL } from './code.config';

export async function buildDescription(data: IBuildCodeInput): Promise<string> {
    const { type, names } = data;
    const { namePascalCase } = names;
    const { name, description, version, author, homepage, license, repository } = await packageJson();
    let content: string = '\r\n';
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


export async function buildMain(data: IBuildCodeInput): Promise<{[key: string]: string}> {
    const { src, dist, names, type, vendor, bundle } = data;
    const { namePascalCase, nameParamCase } = names;

    // read index.ts
    let indexContent: string = '';
    try {
        indexContent = await readFile(`${src}/index.ts`, 'utf-8');
    } catch (error) {
        /* no "src/index.ts" */
    }

    // read global.ts
    let globalContent: string = '';
    try {
        globalContent = await readFile(`${src}/global.ts`, 'utf-8');
    } catch (error) {
        /* no "src/global.ts" */
    }

    // read all except files or folders in BUILD_MAIN_CODE_IGNORE
    let files: string[];
    let filesContent: string[] = [];
    files = readDir(src, (name, index, dir) => {
        const path: string = (<string> dir + '/' + name).replace(src, '');
        const ignore = new RegExp(BUILD_MAIN_CODE_IGNORE.join('|'), 'g');
        return !ignore.test(path);
    });
    for (let i = 0; i < files.length; i++) {
        const path: string = `${src}\\${files[i]}`;
        const content: string = await readFile(path, 'utf-8');
        filesContent.push(content);
    }

    // build description
    const fileDescription: string = await buildDescription(data);

    // main content
    let mainContent: string = (filesContent.join('\r\n\r\n') + '\r\n' + indexContent).trim();
    if (type !== 'app' && !vendor) {
        mainContent = `{
            ${filesContent.join('\r\n\r\n')}
            ${indexContent}
            return moduleExports || {};
        }`;
        mainContent = mainContent.replace(/(export\ )/g, '');
        mainContent = `export function ${namePascalCase}Module() ` +  mainContent;
    }

    // extra
    let npmExtra = `
        // add to the global namespace
        var process = process || this;
        process['${namePascalCase}'] = ${namePascalCase}Module();
    `;
    let gasExtra = `
        // add exports to the global namespace
        export const ${namePascalCase} = ${namePascalCase}Module();
        for (const prop of Object.keys({... ${namePascalCase}, ... Object.getPrototypeOf(${namePascalCase})})) {
            this[prop] = ${namePascalCase}[prop];
        }
    `;

    // outputs
    let npmOutput: string = '';
    let gasOutput: string = '';
    gasOutput = (bundle ? fileDescription: '') + '\r\n' + mainContent;
    if (type !== 'app') {
        npmOutput = fileDescription + '\r\n' + mainContent;
    }

    // extra
    if (type !== 'app' && !vendor) {
        npmOutput = npmOutput + '\r\n\r\n' + npmExtra;
        gasOutput = gasOutput + '\r\n\r\n' + gasExtra;
    }

    // global
    npmOutput = npmOutput + '\r\n\r\n' + globalContent;
    gasOutput = gasOutput + '\r\n\r\n' + globalContent;

    // compile
    if (vendor) {
        const PLACEHOLDER_PHASE = '/**_SHEETBASE_MODULE_VENDOR_CONTENT_HERE_*/';
        const npmExtraCompiled: string = ts2gas(
            PLACEHOLDER_PHASE + npmExtra
        );
        const gasExtraCompiled: string = ts2gas(
            PLACEHOLDER_PHASE + gasExtra
        );
        const npmExtraCompiledSplits = npmExtraCompiled.split(PLACEHOLDER_PHASE);
        const gasExtraCompiledSplits = gasExtraCompiled.split(PLACEHOLDER_PHASE);
        npmOutput = npmExtraCompiledSplits[0] + npmOutput + npmExtraCompiledSplits[1];
        gasOutput = gasExtraCompiledSplits[0] + gasOutput + gasExtraCompiledSplits[1];
    } else {
        npmOutput = ts2gas(npmOutput);
        gasOutput = ts2gas(gasOutput);
    }

    // results
    let result: any = {};
    result[`${dist}/${nameParamCase}.js`] = gasOutput;
    if (type !== 'app') {
        result[`${SHEETBASE_MODULE_FILE_NAME}`] = npmOutput;
    }

    return result;
}

export async function buildIndex(data: IBuildCodeInput): Promise<string> {
    const { src, names } = data;
    const { nameSnakeCase } = names;
    // read "src/example.ts"
    let exampleContent: string = '';
    try {
        exampleContent = await readFile(`${src}/example.ts`, 'utf-8');
        exampleContent = exampleContent.replace(/(export function\ )/g, `export function ${nameSnakeCase}_`);
    } catch (error) {
        /* no "src/example.ts" */
    }
    // get description
    const fileDescription: string = await buildDescription(data);
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
    let filesContent: string[] = [];
    for (let i = 0; i < dependencies.length; i++) {
        const path: string = `${dependencies[i]}`;
        const content: string = await readFile(path, 'utf-8');
        filesContent.push(content);
    }
    return filesContent.join('\r\n\r\n');
}

export async function getPolyfill(): Promise<string> {
    const { data } = await axios.get(POLYFILL_FILE_URL);
    return data;
}