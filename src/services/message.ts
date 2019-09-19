import chalk from 'chalk';

export class MessageService {

  OK = `[${chalk.green('OK')}]`;

  constructor() {}
  
  logOk(message: string) {
    return console.log(`${this.OK} ${message}`);
  }

}
