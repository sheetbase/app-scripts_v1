import chalk from 'chalk';
import { execSync } from 'child_process';

export default async () => {
    try {
        await execSync('clasp push', {cwd: './dist', stdio: 'inherit'});
    } catch (error) {
        console.log(chalk.red('\nErrors pushing project, please try again.'));    
        return process.exit(1);
    }
    return process.exit();
}