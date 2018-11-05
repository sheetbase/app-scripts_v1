import { readFile, readJson } from 'fs-extra';
import { format } from 'prettier';
import * as dedent from 'dedent';
const stripIndent = require('strip-indent');

import { BuildReadmeInput } from './readme.type';
import { packageJson } from '../npm/npm.service';
import { parseInterfaces } from '../typescript/typescript.service';
import { extractString } from '../utils/utils.service';

export async function buildReadme(data: BuildReadmeInput): Promise<string> {
    const { names, docs } = data;
    const { namePascalCase } = names;

    // readme
    let readmeBlockHeader = '';
    let readmeBlockCenter = '';
    let readmeBlockFooter = '';
    try {
        const readmeContent = await readFile('README.md', 'utf-8');
        // header
        readmeBlockHeader = extractString(readmeContent,
            '<!-- <block:header> -->', '<!-- </block:header> -->');
        // content
        readmeBlockCenter = extractString(readmeContent,
            '<!-- <block:center> -->', '<!-- </block:center> -->');
        // footer
        readmeBlockFooter = extractString(readmeContent,
            '<!-- <block:footer> -->', '<!-- </block:footer> -->');
    } catch(error) {
        /* no file */
    }

    // package.json
    const { name, description, homepage, license, repository } = await packageJson();
    const gitUrl = (repository.url).replace('.git', '');
    // docs url
  // need to setup a github page serves 'docs' folder)
    const gitUrlSplit = gitUrl.split('/');
    const orgName: string = gitUrlSplit.splice(gitUrlSplit.length - 2, 1).pop();
    const docsUrl: string = gitUrl.replace(orgName + '/', '')
                                .replace('github.com', `${orgName}.github.io`);

    // .clasp.json
    const { scriptId } = await readJson('.clasp.json') as { scriptId?: string };

    // appsscript.json
    const { oauthScopes } = await readJson('appsscript.json') as { oauthScopes?: string[] };

    // example
    let examples = '';
    try {
        const exampleContent: string = await readFile('src/example.ts', 'utf-8');
        examples = exampleContent.substr(
            exampleContent.indexOf('function example'),
            exampleContent.length,
        ).replace(/(export\ )/g, '');
    } catch(error) {
        /* no file */
    }

    // api
    let api = '';
    try {
        api = await buildApiContent(data);
    } catch(error) {
        /* no file or error */
    }

    const output: string = dedent(`
    # Sheetbase Module: ${name}

    ${description}

${readmeBlockHeader}

    ## Install

    - Using npm: \`npm install --save ${name}\`

    - As a library: \`${scriptId}\`

        Set the _Indentifier_ to **${namePascalCase}** and select the lastest version,
        [view code](https://script.google.com/d/${scriptId}/edit?usp=sharing).

    ${
    oauthScopes ?
    '## Scopes' + '\r\n' + '\`' + oauthScopes.join('\`\r\n\r\n\`') + '\`' :
    ''
    }

${readmeBlockCenter}

    ## Examples

    \`\`\`ts
    ${examples}
    \`\`\`

    ## Documentation

    ${
    docs ?
    `
    See the docs: ${docsUrl}
    ` :
    `
    Homepage: ${homepage}
    `
    }

    ${
    api ?
    `
    ## API

    An overview of the API, for detail please refer [the documentation](${docsUrl}).

    ${api}
    ` :
    ''
    }

    ## License

    **${name}** is released under the [${license}](${gitUrl}/blob/master/LICENSE) license.

${readmeBlockFooter}
    `);
    return format(output, { parser: 'markdown' });
}

async function buildApiContent(data: BuildReadmeInput): Promise<string> {
    const { src, names } = data;
    const { namePascalCase } = names;
    let output = '';

    // parse interface
    const parsedInterfaces = await parseInterfaces(`${src}/types`);

    // build the content
    const interfaceIModule = parsedInterfaces['IModule'];
    const { raw, properties } = interfaceIModule;
    if (!interfaceIModule) {
        throw new Error('No interface IModule.');
    }
    output += `### ${namePascalCase}\r\n\r\n`;
    output += `
    \`\`\`ts
    export interface IModule {
        ${raw}
    }
    \`\`\`
    `;
    properties.forEach(prop => {
        const { parsed } = prop;
        const { name, type  } = parsed;
        const propInterface = parsedInterfaces[type];
        const { raw } = propInterface;
        output += `\r\n\r\n### ${namePascalCase}.${name}\r\n\r\n`;
        output += stripIndent(`
        \`\`\`ts
        export interface ${type} {
            ${raw}
        }
        \`\`\`
        `);
    });

    // output
    return output;
}
