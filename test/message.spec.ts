import { expect } from 'chai';
import * as sinon from 'sinon';

import { Message } from '../src/lib/services/message';

const messageService = new Message();
let logStub: sinon.SinonStub;

function before() {
  logStub = sinon.stub(console, 'log').callsFake(value => value);
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
