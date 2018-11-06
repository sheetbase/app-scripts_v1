import { outputFile, remove } from 'fs-extra';
import { execSync } from 'child_process';
import { resolve } from 'path';

import { buildDocsHtml } from '../services/content';
import { logError } from '../services/message';

interface Options {
    api?: boolean;
    typedoc?: string;
}

export async function docsCommand(options: Options) {
    const DOCS = resolve('.', 'docs');
    try {
        // cleanup
        await remove(DOCS);

        // index.html
        const content = await buildDocsHtml();
        await outputFile(resolve(DOCS, 'index.html'), content);

        // api reference
        if (options.api) {
            const typedoc = options.typedoc ||
            (
                'src --out \"docs/api\" ' +
                '--mode file --readme none ' +
                '--exclude \"**/src/example.ts\" ' +
                '--excludeExternals --excludeNotExported --ignoreCompilerErrors'
            );
            execSync('typedoc ' + typedoc, { cwd: resolve('.'), stdio: 'inherit' });
        }
    } catch (error) {
        return logError(error);
    }
    return process.exit();
}