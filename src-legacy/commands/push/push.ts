import chalk from 'chalk';
import { execSync } from 'child_process';
import { resolve } from 'path';

export async function pushCommand(dir = 'dist') {
    try {
        await execSync('clasp push', {cwd: resolve(dir), stdio: 'inherit'});
    } catch (error) {
        console.error(chalk.red('\nErrors pushing project, please try again.'));
        return process.exit(1);
    }
    return process.exit();
}