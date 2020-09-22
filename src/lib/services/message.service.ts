import {green} from 'chalk';

export class MessageService {
  OK = `[${green('OK')}]`;

  constructor() {}

  logOk(message: string) {
    return console.log(`${this.OK} ${message}`);
  }
}
