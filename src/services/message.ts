import chalk from 'chalk';

export const OK = `[${chalk.green('OK')}]`;

export function logOk(message: string) {
  return console.log(`${OK} ${message}`);
}
