import { outputFile } from 'fs-extra';
import { execSync } from 'child_process';
import { resolve } from 'path';

import { buildDocsMd } from '../services/content';
import { logError, logSucceed } from '../services/message';

interface Options {
    api?: boolean;
    typedoc?: string;
}

export async function docsCommand(options: Options) {
    const DOCS = resolve('.', 'docs');
    try {

        // index
        const content = await buildDocsMd();
        await outputFile(resolve(DOCS, 'index.md'), content);

        // api reference
        if (options.api) {
            const typedoc = options.typedoc ||
            (
                'src --out \"docs/api\" ' +
                '--mode file --readme none ' +
                '--exclude \"**/src/example.ts\" ' +
                '--excludeExternals --excludeNotExported --ignoreCompilerErrors'
            );
            execSync('typedoc ' + typedoc, { cwd: resolve('.'), stdio: 'ignore' });
        }
    } catch (error) {
        return logError(error);
    }
    return logSucceed('Docs generated.');
}