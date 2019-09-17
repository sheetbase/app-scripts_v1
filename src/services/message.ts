import chalk from 'chalk';

export const ERROR = `[${chalk.red('ERROR')}]`;
export const OK = `[${chalk.green('OK')}]`;

export function logError(message: string) {
  console.error(`${ERROR} ${message}`);
  process.exit(1);
}

export function logOk(message: string) {
  console.log(`${OK} ${message}`);
}
