import { expect } from 'chai';
import * as sinon from 'sinon';

import * as Message from '../src/services/message';

let logStub: sinon.SinonStub;

function before() {
  logStub = sinon.stub(console, 'log').callsFake(value => value);
}

function after() {
  logStub.restore();
}

describe('Message service', () => {
  beforeEach(before);
  afterEach(after);

  it('OK', () => {
    expect(Message.OK).equal('[\u001b[32mOK\u001b[39m]');
  });

  it('#logOk', () => {
    const result = Message.logOk('xxx');
    expect(result).equal('[\u001b[32mOK\u001b[39m] xxx');
  });
});
