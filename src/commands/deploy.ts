import { execSync } from 'child_process';
import { resolve } from 'path';

import { logError } from '../services/message';

export async function deployCommand(dir = 'deploy') {
    try {
        await execSync('clasp push', {cwd: resolve('.', dir), stdio: 'inherit'});
    } catch (error) {
        return logError(error);
    }
    return process.exit();
}