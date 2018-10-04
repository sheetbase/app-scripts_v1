import { readFile } from 'fs-extra';
import { format } from 'prettier';
const readDir = require('fs-readdir-recursive');

import { IBuildCodeInput } from './code.type';
import { packageJson } from '../npm/npm.service';
import { BUILD_MAIN_CODE_IGNORE } from './code.config';

export async function buildDescription(data: IBuildCodeInput): Promise<string> {
    const { type } = data;
    const { name, description, version, author, homepage, license, repository } = await packageJson();
    let content: string = '';
    content += '/**';
    if (type) { content += `\r\n* Sheetbase ${type}`; }
    if (name) { content += `\r\n* Name: ${name}`; }
    if (description) { content += `\r\n* Description: ${description}`; }
    if (version) { content += `\r\n* Version: ${version}`; }
    if (author) { content += `\r\n* Author: ${author}`; }
    if (homepage || repository) { content += `\r\n* Homepage: ${homepage || repository.url}`; }
    if (license) { content += `\r\n* License: ${license}`; }
    if (repository) { content += `\r\n* Repo: ${repository.url}`; }
    content += '\r\n*/\r\n\r\n';
    return content;
}

export async function buildMainSource(data: IBuildCodeInput): Promise<{
    gas: string;
    npm: string;
}> {
    const { src, names, bundle } = data;
    const { namePascalCase, nameConstantCase } = names;

    let files: string[]
    let fileContent: string[] = [];
    let indexContent: string = '';
    let output: string = '';
    let npmOutput: string = '';
    let gasOutput: string = '';

    // read index.ts
    indexContent = await readFile(`${src}/index.ts`, 'utf-8');

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

    // sum up
    output = `
        {
            ${fileContent.join('\r\n\r\n')}

            ${indexContent}

            return moduleExports;
        }
    `;
    output = output.replace(/(export\ )/g, '');
    output = `export function ${namePascalCase}() ` + output;

    // custom
    npmOutput = fileDescription + output;
    gasOutput = (bundle ? fileDescription: '') + output + `
        // add exports to the global namespace
        export const ${nameConstantCase} = ${namePascalCase}();
        for (const prop of Object.keys({... ${nameConstantCase}, ... Object.getPrototypeOf(${nameConstantCase})})) {
            this[prop] = ${nameConstantCase}[prop];
        }
    `;

    // format
    npmOutput = format(npmOutput, { parser: 'typescript' });
    gasOutput = format(gasOutput, { parser: 'typescript' });

    return {
        gas: gasOutput,
        npm: npmOutput
    }
}

export async function buildGASIndex(data: IBuildCodeInput): Promise<string> {
    const { src, names } = data;
    const { nameSnakeCase } = names;

    let exampleContent: string = '';
    let output: string = '';

    // read src/example.ts
    try {
        exampleContent = await readFile(`${src}/example.ts`, 'utf-8');
        exampleContent = exampleContent.replace(/(export function\ )/g, `export function ${nameSnakeCase}_`);
    } catch (error) {
        /* */
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

export async function buildDependenciesBundle(dependencies: string[]) {
    let fileContent: string[] = [];
    for (let i = 0; i < dependencies.length; i++) {
        const path: string = `${dependencies[i]}`;
        const content: string = await readFile(path, 'utf-8');
        fileContent.push(content);
    }
    return fileContent.join('\r\n\r\n');
}