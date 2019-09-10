import chalk from 'chalk';

export const error = `[${chalk.red('ERROR')}]`;
export const succeed = `[${chalk.green('OK')}]`;

export function logError(message: string): void {
  console.error(`${error} ${message}`);
  return process.exit(1);
}

export function logSucceed(message: string): void {
  console.log(`${succeed} ${message}`);
  return process.exit();
}
