import { execSync } from 'child_process';
import { resolve } from 'path';

import { logError } from '../services/message';

interface Options {
    version?: string | boolean;
}

export async function deployCommand(dir = 'deploy', options: Options) {
    try {
        await execSync('clasp push', {cwd: resolve('.', dir), stdio: 'inherit'});
        if (options.version) {
            const description: string = (typeof options.version === 'string') ? options.version : '';
            await execSync(
                'clasp version' + (!!description ? ' ' + description : ''),
                {cwd: resolve('.', dir), stdio: 'inherit'},
            );
        }
    } catch (error) {
        return logError(error);
    }
    return process.exit();
}