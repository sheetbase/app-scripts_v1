import { readFile, readJson } from 'fs-extra';
import { format } from 'prettier';
import * as dedent from 'dedent';
const stripIndent = require('strip-indent');

import { IBuildReadmeInput } from './readme.type';
import { packageJson } from '../npm/npm.service';
import { parseInterfaces } from '../typescript/typescript.service';

export async function buildReadme(data: IBuildReadmeInput): Promise<string> {
    const { names, docs } = data;
    const { namePascalCase } = names;

    // readme
    let header: string = '';
    let content: string = '';
    let footer: string = '';
    try {
        const readmeContent = await readFile('README.md', 'utf-8');
        
        // header
        const HEADER_START = '<!-- <header> -->';
        const HEADER_END = '<!-- </header> -->';
        header = readmeContent.substring(
            readmeContent.lastIndexOf(HEADER_START), 
            readmeContent.lastIndexOf(HEADER_END) + HEADER_END.length
        );

        // content
        const CONTENT_START = '<!-- <content> -->';
        const CONTENT_END = '<!-- </content> -->';
        content = readmeContent.substring(
            readmeContent.lastIndexOf(CONTENT_START), 
            readmeContent.lastIndexOf(CONTENT_END) + CONTENT_END.length
        );
    
        // footer
        const FOOTER_START = '<!-- <footer> -->';
        const FOOTER_END = '<!-- </footer> -->';
        footer = readmeContent.substring(
            readmeContent.lastIndexOf(FOOTER_START), 
            readmeContent.lastIndexOf(FOOTER_END) + FOOTER_END.length
        );
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
    let docsUrl: string = gitUrl.replace(orgName + '/', '')
                                .replace('github.com', `${orgName}.github.io`);

    // .clasp.json
    const { scriptId } = <{ scriptId?: string }> await readJson('.clasp.json');

    // appsscript.json
    const { oauthScopes } = <{ oauthScopes?: string[] }> await readJson('appsscript.json');

    // example
    let examples: string = '';
    try {
        const exampleContent: string = await readFile('src/example.ts', 'utf-8');
        examples = exampleContent.substr(
            exampleContent.indexOf('function example'),
            exampleContent.length
        ).replace(/(export\ )/g, '');
    } catch(error) {
        /* no file */
    }
    
    // api
    let api: string = '';
    try {
        api = await buildApi(data);
    } catch(error) {       
        /* no file or error */
    }

    let output: string = dedent(`
    # Sheetbase Module: ${name}

    ${description}

    ${header}

    ## Install

    - Using npm: \`npm install --save ${name}\`

    - As a library: \`${scriptId}\`
    
        Set the _Indentifier_ to **${namePascalCase}** and select the lastest version, [view code](https://script.google.com/d/${scriptId}/edit?usp=sharing).

    ${
    oauthScopes ?
    '## Scopes' + '\r\n' + '\`' + oauthScopes.join('\`\r\n\r\n\`') + '\`':
    ''
    }

    ${content}

    ## Examples

    \`\`\`ts
    ${examples}
    \`\`\`
    
    ## Documentation

    ${
    docs ?
    `
    See the docs: ${docsUrl}
    `:
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
    `:
    ''
    }

    ## License

    **${name}** is released under the [${license}](${gitUrl}/blob/master/LICENSE) license.

    ${footer}
    `);
    return format(output, { parser: 'markdown' });
}

async function buildApi(data: IBuildReadmeInput): Promise<string> {
    const { src, names } = data;
    const { namePascalCase } = names;
    let output: string = '';
    
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
    })

    // output
    return output;
}
