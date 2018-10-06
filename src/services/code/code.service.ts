import { readFile } from 'fs-extra';
import { format } from 'prettier';
import axios from 'axios';
const readDir = require('fs-readdir-recursive');

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
    content += '\r\n*/\r\n\r\n';
    return format(content, { parser: 'typescript' });
}


export async function buildCode(data: IBuildCodeInput): Promise<{[key: string]: string}> {
    const { src, dist, names, type, vendor, bundle, ugly } = data;
    const { namePascalCase, nameParamCase } = names;

    let files: string[]
    let fileContent: string[] = [];
    let indexContent: string = '';
    let mainContent: string = '';
    let npmOutput: string = '';
    let gasOutput: string = '';
    let result: any = {};

    // read index.ts
    try {
        indexContent = await readFile(`${src}/index.ts`, 'utf-8');
    } catch (error) {
        /* no "src/index.ts" */
    }

    // read all except index.ts and types
    files = readDir(src, (name, index, dir) => {
        const path: string = (<string> dir + '/' + name).replace(src, '');
        const ignore = new RegExp(BUILD_MAIN_CODE_IGNORE.join('|'), 'g');
        return !ignore.test(path);
    });
    for (let i = 0; i < files.length; i++) {
        const path: string = `${src}\\${files[i]}`;
        const content: string = await readFile(path, 'utf-8');
        fileContent.push(content);
    }

    // get description
    const fileDescription: string = await buildDescription(data);

    // generate results
    if (type === 'app') {
        mainContent = `
            ${fileContent.join('\r\n\r\n')}
            ${indexContent}
        `;
        // sum up
        gasOutput = (bundle ? fileDescription: '') +
                    '\r\n' +
                    mainContent;
        gasOutput = format(gasOutput, { parser: 'typescript' });
        // result
        result[`${dist}/${nameParamCase}.ts`] = gasOutput;
        result[`${dist}/@index.ts`] = await buildIndex(data);
    } else {
        if (vendor) {
            mainContent = `
                ${fileContent.join('\r\n\r\n')}
                ${indexContent}
            `;
        } else {
            mainContent = `
                {
                    ${fileContent.join('\r\n\r\n')}
                    ${indexContent}
                    return moduleExports || {};
                }
            `;
            mainContent = mainContent.replace(/(export\ )/g, '');
            mainContent = `export function ${namePascalCase}Module() ` +  mainContent;
        }
        if (!ugly) {
            mainContent = format(mainContent, { parser: 'typescript' });
        }
        mainContent = mainContent.trim();
        // extra
        let npmOutputExtra: string = `
            // add to the global namespace
            var proccess = proccess || this;
            proccess['${namePascalCase}'] = ${namePascalCase}Module();
        `;
        npmOutputExtra = format(npmOutputExtra, { parser: 'typescript' });
        let gasOutputExtra: string = `
            // add exports to the global namespace
            export const ${namePascalCase} = ${namePascalCase}Module();
            for (const prop of Object.keys({... ${namePascalCase}, ... Object.getPrototypeOf(${namePascalCase})})) {
                this[prop] = ${namePascalCase}[prop];
            }
        `;
        gasOutputExtra = format(gasOutputExtra, { parser: 'typescript' });
        // sum up
        npmOutput = fileDescription +
                    '\r\n' +
                    mainContent +
                    '\r\n\r\n' +
                    npmOutputExtra;
        gasOutput = (bundle ? fileDescription: '') +
                    '\r\n' +
                    mainContent +
                    '\r\n\r\n' +
                    gasOutputExtra;
        // result
        result[`${dist}/${nameParamCase}.ts`] = gasOutput;
        result[`${dist}/@index.ts`] = await buildIndex(data);
        result[`${SHEETBASE_MODULE_FILE_NAME}`] = npmOutput;
    }
    return result;
}

export async function buildIndex(data: IBuildCodeInput): Promise<string> {
    const { src, names } = data;
    const { nameSnakeCase } = names;

    let exampleContent: string = '';
    let output: string = '';

    // read src/example.ts
    try {
        exampleContent = await readFile(`${src}/example.ts`, 'utf-8');
        exampleContent = exampleContent.replace(/(export function\ )/g, `export function ${nameSnakeCase}_`);
    } catch (error) {
        /* no "src/example.ts" */
    }

    // get description
    const fileDescription: string = await buildDescription(data);

    // sum up
    output = `
        ${fileDescription}        
        ${exampleContent}
    `;
    output = format(output, { parser: 'typescript' });
    
    return output;
}

export async function buildDependenciesBundle(dependencies: string[]): Promise<string> {
    let fileContent: string[] = [];
    for (let i = 0; i < dependencies.length; i++) {
        const path: string = `${dependencies[i]}`;
        const content: string = await readFile(path, 'utf-8');
        fileContent.push(content);
    }
    return fileContent.join('\r\n\r\n');
}

export async function getPolyfill(): Promise<string> {
    const { data } = await axios.get(POLYFILL_FILE_URL);
    return data;
}