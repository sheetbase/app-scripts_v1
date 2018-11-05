import chalk from 'chalk';

export const error = `[${chalk.red('ERROR')}]`;
export const warn = `[${chalk.yellow('WARN')}]`;
export const info = `[${chalk.blue('INFO')}]`;
export const wait = `[${chalk.magenta('WAIT')}]`;

export function logError(message: string): void {
    console.error(`${error} ${message}`);
    return process.exit(1);
}
export function logWarn(message: string): void {
    console.log(`${warn} ${message}`);
}
export function logInfo(message: string): void {
    console.log(`${info} ${message}`);
}
export function logWait(message: string): void {
    console.log(`${wait} ${message}`);
}

export const ERROR = {

};

export const LOG = {
};