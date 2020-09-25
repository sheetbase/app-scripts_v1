import {green, red} from 'chalk';

export class MessageService {
  OK = `[${green('OK')}]`;
  ERROR = `[${red('ERROR')}]`;

  constructor() {}

  logOk(message: string) {
    return console.log(`${this.OK} ${message}`);
  }

  logError(message: string) {
    return console.log(`${this.ERROR} ${message}`);
  }
}
