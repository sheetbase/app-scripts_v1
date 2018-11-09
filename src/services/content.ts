import { EOL } from 'os';
import { resolve } from 'path';
import { readdirSync, readJson, readFile, pathExists } from 'fs-extra';
import { rollup, OutputOptions } from 'rollup';
import { format } from 'prettier';
import { paramCase, sentenceCase } from 'change-case';
import * as requireFromString from 'require-from-string';
import * as matchAll from 'match-all';
import * as ts2gas from 'ts2gas';
import { Converter } from 'showdown';
const converter = new Converter();

import { extractString } from './utils';

const EOL2X = EOL.repeat(2);

export interface PackageJson {
    name?: string;
    version?: string;
    description?: string;
    main?: string;
    module?: string;
    typings?: string;
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

export interface RollupConfig {
    input: string;
    output: OutputOptions[];
    external?: string[];
}

export async function getPackageJson(path = '.'): Promise<PackageJson & {
    gitUrl?: string;
    pageUrl?: string;
}> {
    const data: PackageJson = await readJson(resolve('.', path, 'package.json'));
    if (data.repository && data.repository.url) {
        const gitUrl = (data.repository.url).replace('.git', '');
        const gitUrlSplit = gitUrl.split('/');
        const accountName: string = gitUrlSplit.splice(gitUrlSplit.length - 2, 1).pop();
        const pageUrl: string = gitUrl.replace(accountName + '/', '').replace(
            'github.com', `${accountName}.github.io`,
        );
        data['gitUrl'] = gitUrl;
        data['pageUrl'] = pageUrl;
    }
    return data;
}

export async function getDotClaspJson(path = '.'): Promise<DotClaspJson> {
    return await readJson(resolve('.', path, '.clasp.json'));
}

export async function getAppsscriptJson(path = '.'): Promise<AppsscriptJson> {
    return await readJson(resolve('.', path, 'appsscript.json'));
}

export async function getRollupConfig(path = '.'): Promise<RollupConfig> {
    const bundle = await rollup({
        input: resolve(path, 'rollup.config.js'),
    });
    const { code } = await bundle.generate({ format: 'cjs' });
    return requireFromString(code);
}

export async function getRollupOutputs(path = '.'): Promise<{
    [format: string]: OutputOptions;
}> {
    const result = {};
    let { output } = await getRollupConfig(path);
    if (!(output instanceof Array)) {
        output = [output];
    }
    for (let i = 0; i < output.length; i++) {
        const out = output[i];
        result[out.format] = out;
    }
    return result;
}

export async function buildDescription(): Promise<string> {
    const { name, description, version, author, homepage, license, repository } = await getPackageJson();
    const { umd } = await getRollupOutputs();
    const exportName = umd.name;
    let content = EOL;
    content += '/**';
    content += EOL + `* A Sheetbase Module`;
    if (name) { content += EOL + `* Name: ${name}`; }
    if (exportName) { content += EOL + `* Export name: ${exportName}`; }
    if (description) { content += EOL + `* Description: ${description}`; }
    if (version) { content += EOL + `* Version: ${version}`; }
    if (author) { content += EOL + `* Author: ${author}`; }
    if (homepage || repository) { content += EOL + `* Homepage: ${homepage || repository.url}`; }
    if (license) { content += EOL + `* License: ${license}`; }
    if (repository) { content += EOL + `* Repo: ${repository.url}`; }
    content += EOL + '*/';
    return format(content, { parser: 'typescript' });
}

export async function getReadmeBlocks(path = '.'): Promise<{[name: string]: string;}> {
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

export async function getCodeExamples(path = '.'): Promise<string> {
    let content = '';
    const exPath = resolve('.', path, 'src', 'example.ts');
    if (!! await pathExists(exPath)) {
        content = await readFile(exPath, 'utf-8');
    }
    return content;
}

export async function buildCodeExamples(path = '.'): Promise<string> {
    let content = await getCodeExamples(path);
    content = !!content ? ts2gas(content) : '';
    // remove ES6 import lines (commented out)
    content = content.replace(/\/\/ import [^\n]*/g, '');
    // remove CommonJS related lines
    content = content.replace(/var exports = [^\n]*/g, '')
        .replace(/var module = [^\n]*/g, '')
        .replace(/exports\.[^\n]*/g, '')
        .replace(/module\.exports\.[^\n]*/g, '');
    return format(content, { parser: 'flow' });
}

export async function buildDocs(path = '.', title?: string, description?: string): Promise<{
    title?: string;
    description?: string;
    toc?: string;
    article?: string;
}> {
    const ARTICLES = resolve('.', path, 'docs');
    // content
    let toc = '';
    let article = '';
    // load files
    if (!!await pathExists(ARTICLES)) {
        const files = readdirSync(ARTICLES, { encoding: 'utf8' });
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.indexOf('.md') > -1 && file !== 'index.md') {
                const name = file.replace('.md', '');
                toc += EOL2X + `- [${sentenceCase(name)}](#${paramCase(name)})`;
                article += EOL2X + (
                    await readFile(resolve(ARTICLES, `${name}.md`), 'utf-8')
                ).replace(
                    /\#\ /g, '## ',
                );
            }
        }
    }
    // final touches
    const { name, pageUrl: docsUrl } = await getPackageJson();
    title = title ? '#' + title : `# ${name}`;
    description = description || '';
    toc = toc + EOL2X + `- [API Reference](${docsUrl}/api)`;
    return { title, description, toc, article };
}

export async function buildDocsMd(path = '.'): Promise<string> {
    const { title, description, toc, article } = await buildDocs(path);
    const content = title + EOL2X + description + EOL2X + toc + EOL2X + article;
    return format(content, { parser: 'markdown' });

}
