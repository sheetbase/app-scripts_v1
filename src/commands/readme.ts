import { resolve } from 'path';
import { outputFile } from 'fs-extra';
import { format } from 'prettier';

import {
    getPackageJson,
    getRollupConfig,
    getDotClaspJson,
    getAppsscriptJson,
    getReadmeBlocks,
    getCodeExamples,
} from '../services/content';
import { logError } from '../services/message';

interface Options {
    docs?: string;
}

export async function readmeCommand(options: Options) {
    try {

        const { name, description, homepage, license, gitUrl, pageUrl: docsUrl} = await getPackageJson();

        const { output: rollupConfigOutput } = await getRollupConfig();
        const exportName = rollupConfigOutput.name;

        const { scriptId } = await getDotClaspJson();

        const { oauthScopes } = await getAppsscriptJson();

        const {
            header: blockHeader = '',
            center: blockCenter = '',
            footer: blockFooter = '',
        } = await getReadmeBlocks() as {
            header?: string;
            center?: string;
            footer?: string;
        };

        const examples = await getCodeExamples();

        const output = `
# Sheetbase Module: ${name}

${description}

${blockHeader}

## Install

- Using npm: \`npm install --save ${name}\`

- As a library: \`${scriptId}\`

    Set the _Indentifier_ to **${exportName}Module** and select the lastest version,
    [view code](https://script.google.com/d/${scriptId}/edit?usp=sharing).

${oauthScopes ? '## Scopes' + '\r\n' + '\`' + oauthScopes.join('\`\r\n\r\n\`') + '\`' : ''}

${blockCenter}

## Examples

\`\`\`ts
${examples}
\`\`\`

## Documentation

${options.docs ? `See the docs: ${docsUrl}` : `Homepage: ${homepage}`}

## License

**${name}** is released under the [${license}](${gitUrl}/blob/master/LICENSE) license.

${blockFooter}
        `;

        await outputFile(resolve('.', 'README.md'), format(output, { parser: 'markdown' }));
    } catch (error) {
        return logError(error);
    }
    console.log('Save README.md.');
    return process.exit();
}