// tslint:disable: no-any
import { expect } from 'chai';
import * as sinon from 'sinon';
import {
  MockedReturnsValues,
  getModuleRewired,
  setMockedReturnsValues,
} from './index.spec';

class MockedRollup {
  // rollup
  inputArg: any;
  async rollup(input: any) {
    this.inputArg = input;
    return this;
  }
  // write
  outputArgList: any[] = [];
  async write(output: any) {
    this.outputArgList.push(output);
    return this;
  }
}

class MockedProjectService {
  constructor(returnsValues: MockedReturnsValues = {}) {
    setMockedReturnsValues(this, returnsValues);
  }
  // getPackageJson
  getPackageJsonMockedReturns: any = {};
  async getPackageJson() {
    return this.getPackageJsonMockedReturns;
  }
}

async function getService(
  mockedRollup?: MockedRollup,
  mockedProjectService?: MockedProjectService,
) {
  const m = await getModuleRewired(
    () => import('../src/services/rollup'),
    {
      'rollup': mockedRollup || new MockedRollup(),
      'rollup-plugin-node-resolve': (configs: any) => configs,
      'rollup-plugin-commonjs': (configs: any) => configs,
    },
  );
  return new m.RollupService(
    mockedProjectService ||
    new MockedProjectService() as any,
  );
}

describe('services/rollup.ts', () => {

  it('#getConfigs (no values)', async () => {
    const rollupService = await getService();

    const result = await rollupService.getConfigs();
    expect(result).eql({
      resolveConfigs: {},
      commonjsConfigs: {},
    });
  });

  it('#getConfigs (has values)', async () => {
    const rollupService = await getService(
      undefined,
      new MockedProjectService({
        getPackageJson: {
          rollup: {
            commonjs: { a: 1 },
          },
        }
      }),
    );

    const result = await rollupService.getConfigs();
    expect(result).eql({
      resolveConfigs: {},
      commonjsConfigs: { a: 1 },
    });
  });

  it('#bundleCode', async () => {
    const mockedRollup = new MockedRollup();
    const rollupService = await getService(
      mockedRollup, // test rollup method args
    );

    // test plugin configs
    const getConfigsStub = sinon.stub(rollupService, 'getConfigs')
    .callsFake(async () => ({
      resolveConfigs: { a: 1 },
      commonjsConfigs: { b: 2 },
    }));

    const outputs = [
      {
        format: 'umd',
        file: 'xxx',
      },
      {
        format: 'esm',
        file: 'xxx2',
      }
    ];
    await rollupService.bundleCode('xxx', outputs as any);
    expect(mockedRollup.inputArg.input).equal('xxx');
    expect(mockedRollup.inputArg.plugins[0]).eql({ a: 1 }, 'resolve');
    expect(mockedRollup.inputArg.plugins[1]).eql({ b: 2 }, 'commonjs');
    expect(mockedRollup.outputArgList).eql(outputs);

    // clean stub
    getConfigsStub.restore();
  });

});