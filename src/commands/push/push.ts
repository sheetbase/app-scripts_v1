import chalk from 'chalk';
import { execSync } from 'child_process';

export async function pushCommand() {
    try {
        await execSync('clasp push', {cwd: './dist', stdio: 'inherit'});
    } catch (error) {
        console.error(chalk.red('\nErrors pushing project, please try again.'));
        return process.exit(1);
    }
    return process.exit();
}