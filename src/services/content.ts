import { resolve } from 'path';
import { readJson, readFile, pathExists } from 'fs-extra';
import { rollup, RollupFileOptions } from 'rollup';
import { format } from 'prettier';
import * as requireFromString from 'require-from-string';
import * as matchAll from 'match-all';
import * as ts2gas from 'ts2gas';

import { extractString } from './utils';

export interface PackageJson {
    name?: string;
    version?: string;
    description?: string;
    author?: string;
    homepage?: string;
    license?: string;
    scripts?: {[key: string]: string};
    keywords?: string[];
    repository?: {
      type?: string;
      url?: string;
    };
    bugs?: {
      url?: string;
    };
    dependencies?: {[key: string]: string};
    devDependencies?: {[key: string]: string};
    peerDependencies?: {[key: string]: string};
}

export interface DotClaspJson {
    scriptId: string;
    projectId?: string;
}

export interface AppsscriptJson {
    timeZone?: string;
    dependencies?: {
        libraries?: Array<{
            userSymbol?: string;
            libraryId?: string;
            version?: string;
        }>;
    };
    exceptionLogging?: string;
    oauthScopes?: string[];
}

export async function getPackageJson(path = '.'): Promise<PackageJson & {
    gitUrl?: string;
    pageUrl?: string;
}> {
    const data = await readJson(resolve('.', path, 'package.json'));
    const gitUrl = (data.repository.url).replace('.git', '');
    const gitUrlSplit = gitUrl.split('/');
    const accountName: string = gitUrlSplit.splice(gitUrlSplit.length - 2, 1).pop();
    const pageUrl: string = gitUrl.replace(accountName + '/', '').replace(
        'github.com', `${accountName}.github.io`,
    );
    return { ... data, gitUrl, pageUrl };
}

export async function getDotClaspJson(path = '.'): Promise<DotClaspJson> {
    return await readJson(resolve('.', path, '.clasp.json'));
}

export async function getAppsscriptJson(path = '.'): Promise<AppsscriptJson> {
    return await readJson(resolve('.', path, 'appsscript.json'));
}

export async function getRollupConfig(rootPath = '.'): Promise<RollupFileOptions> {
    const bundle = await rollup({
        input: resolve(rootPath, 'rollup.config.js'),
    });
    const { code } = await bundle.generate({ format: 'cjs' });
    return requireFromString(code);
}

export async function buildDescription(): Promise<string> {
    const { name, description, version, author, homepage, license, repository } = await getPackageJson();
    const { output: rollupConfigOutput } = await getRollupConfig();
    const exportName = rollupConfigOutput.name;
    let content = '\r\n';
    content += '/**';
    content += `\r\n* Sheetbase module`;
    if (name) { content += `\r\n* Name: ${name}`; }
    if (exportName) { content += `\r\n* Export name: ${exportName}`; }
    if (description) { content += `\r\n* Description: ${description}`; }
    if (version) { content += `\r\n* Version: ${version}`; }
    if (author) { content += `\r\n* Author: ${author}`; }
    if (homepage || repository) { content += `\r\n* Homepage: ${homepage || repository.url}`; }
    if (license) { content += `\r\n* License: ${license}`; }
    if (repository) { content += `\r\n* Repo: ${repository.url}`; }
    content += '\r\n*/';
    return format(content, { parser: 'typescript' });
}

export async function getReadmeBlocks(path = '.') {
    const blocks = {};
    const content = await readFile(resolve('.', path, 'README.md'), 'utf-8');
    const names = matchAll(content, /\<block\:([a-zA-Z0-9]+)\>/gi).toArray();
    for (let i = 0; i < names.length; i++) {
        const name = names[i];
        blocks[name] = extractString(content,
            `<!-- <block:${name}> -->`, `<!-- </block:${name}> -->`,
        );
    }
    return blocks;
}

export async function getCodeExamples(path = '.') {
    let content = '';
    const exPath = resolve('.', path, 'src', 'example.ts');
    if (!! await pathExists(exPath)) {
        content = await readFile(exPath, 'utf-8');
    }
    return content;
}

export async function buildCodeExamples(path = '.') {
    let content = await getCodeExamples(path);
    content = !!content ? ts2gas(content) : '';
    return content;
}
