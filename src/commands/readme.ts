import { EOL } from 'os';
import { resolve } from 'path';
import { outputFile } from 'fs-extra';
import { format } from 'prettier';

import {
    getPackageJson,
    getDotClaspJson,
    getAppsscriptJson,
    getReadmeBlocks,
    getCodeExamples,
    getRollupOutputs,
} from '../services/content';
import { logError, logSucceed } from '../services/message';

interface Options {
    docs?: string;
}

export async function readmeCommand(options: Options) {
    try {

        const { name, description, homepage, license, gitUrl, pageUrl: docsUrl} = await getPackageJson();

        const { umd } = await getRollupOutputs();
        const exportName = umd.name;

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

Using npm: \`npm install --save ${name}\`

\`\`\`ts
import * as ${exportName} from '${name}';
\`\`\`

As a library: \`${scriptId}\`

Set the _Indentifier_ to **${exportName}Module** and select the lastest version, \
[view code](https://script.google.com/d/${scriptId}/edit?usp=sharing).

\`\`\`ts
declare const ${exportName}Module: { ${exportName}: any };
const ${exportName} = ${exportName}Module.${exportName};
\`\`\`

${oauthScopes ? '## Scopes' + EOL + '\`' + oauthScopes.join(EOL.repeat(2)) + '\`' : ''}

${blockCenter}

## Usage

${!options.docs ? `- Homepage: ${homepage}` : `
- Docs homepage: ${docsUrl}

- API reference: ${docsUrl}/api
`}

${!examples ? '' : `
### Examples

\`\`\`ts
${examples}
\`\`\`
`}

## License

**${name}** is released under the [${license}](${gitUrl}/blob/master/LICENSE) license.

${blockFooter}
        `;

        await outputFile(resolve('.', 'README.md'), format(output, { parser: 'markdown' }));
    } catch (error) {
        return logError(error);
    }
    return logSucceed('README.md saved.');
}