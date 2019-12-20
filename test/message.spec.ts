import { expect } from 'chai';
import { sinon } from '@lamnhan/testea';

import { MessageService } from '../src/lib/services/message';

const messageService = new MessageService();
let logStub: sinon.SinonStub;

function before() {
  // tslint:disable-next-line: no-any
  logStub = sinon.stub(console, 'log').callsFake(value => value) as any;
}

function after() {
  logStub.restore();
}

describe('services/message.ts', () => {
  beforeEach(before);
  afterEach(after);

  it('OK', () => {
    expect(messageService.OK).equal('[\u001b[32mOK\u001b[39m]');
  });

  it('#logOk', () => {
    const result = messageService.logOk('xxx');
    expect(result).equal('[\u001b[32mOK\u001b[39m] xxx');
  });
});
