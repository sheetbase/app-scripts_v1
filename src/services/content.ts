import { EOL } from 'os';
import { resolve } from 'path';
import { readdirSync, readJson, readFile, pathExists } from 'fs-extra';
import { rollup, RollupFileOptions } from 'rollup';
import { format } from 'prettier';
import { paramCase, sentenceCase } from 'change-case';
import * as requireFromString from 'require-from-string';
import * as matchAll from 'match-all';
import * as ts2gas from 'ts2gas';
import { Converter } from 'showdown';
const converter = new Converter();

import { extractString } from './utils';

export interface PackageJson {
    name?: string;
    version?: string;
    description?: string;
    main?: string;
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
    let content = EOL;
    content += '/**';
    content += EOL + `* Sheetbase module`;
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

export async function buildDocsMd(path = '.'): Promise<string> {
    const ARTICLES = resolve('.', path, 'articles');
    const EOL2X = EOL.repeat(2);
    // content
    let title = '';
    let toc = '';
    let article = '';
    // load files
    if (!!await pathExists(ARTICLES)) {
        const files = readdirSync(ARTICLES, { encoding: 'utf8' });
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.indexOf('.md') > -1) {
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
    title = `# Documentation: ${name}`;
    toc = `- [API Reference](${docsUrl}/api)` + EOL2X + toc;
    return title + EOL2X + toc + EOL2X + article;
}

export async function buildDocsHtml(path = '.'): Promise<string> {
    const mdContent = await buildDocsMd(path);
    const content = converter.makeHtml(mdContent);
    const output = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <link rel="stylesheet" \
    href="https://cdnjs.cloudflare.com/ajax/libs/mini.css/3.0.1/mini-default.min.css" />
</head>
<body>
    <div class="container">
        <div class="row">
            <div class="col-md-12">
                ${content}
            </div>
        </div>
    </div>
</body>
</html>
    `;
    return output;
}