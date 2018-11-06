import { execSync } from 'child_process';
import { resolve } from 'path';

import { logError } from '../services/message';

interface Options {
    typedoc?: string;
}

export async function apiCommand(options: Options) {
    try {
        const typedoc = options.typedoc ||
        (
            'src --out docs ' +
            '--mode file --target ES6 ' +
            '--exclude \"**/src/example.ts\" ' +
            '--excludeExternals --excludeNotExported --ignoreCompilerErrors'
        );
        execSync('typedoc ' + typedoc, { cwd: resolve('.'), stdio: 'inherit' });
    } catch (error) {
        return logError(error);
    }
    return process.exit();
}