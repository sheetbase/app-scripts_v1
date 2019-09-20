// tslint:disable: no-any
import { expect } from 'chai';
import {
  MockBuilder,
  buildMock,
  MethodStubs,
  rewireModule,
} from './index.spec';

import { RollupService } from '../src/services/rollup';

// rollup
type MockedRollup = MockBuilder<typeof defaultRollupModule>;
const defaultRollupModule = {
  rollup: '*',
  write: '*',
};
function mockRollupModule(methods = {}) {
  return buildMock(defaultRollupModule, methods);
}

// services/project.ts
type MockedProjectService = MockBuilder<typeof defaultProjectService>;
const defaultProjectService = {
  getPackageJson: async () => ({}),
};
function mockProjectService(methods = {}) {
  return buildMock(defaultProjectService, methods);
}

async function getData(
  mockedRollup?: MockedRollup,
  mockedProjectService?: MockedProjectService,
  methodStubs: MethodStubs = {},
) {
  // rewire module
  const moduleRewiring = rewireModule(
    () => import('../src/services/rollup'),
    {
      'rollup': mockedRollup || mockRollupModule(),
      'rollup-plugin-node-resolve': (configs: any) => configs,
      'rollup-plugin-commonjs': (configs: any) => configs,
    },
  );
  // rewire service
  const serviceRewiring = await moduleRewiring.rewireService<RollupService>(
      'RollupService',
      {
        projectService: mockedProjectService || mockProjectService(),
      },
      methodStubs,
    );
  // get a service instance
  const service = serviceRewiring.getInstance();
  // return data
  return {
    moduleRewiring,
    serviceRewiring,
    service,
  };
}

describe('services/rollup.ts', () => {

  it('#getConfigs (no values)', async () => {
    const { service } = await getData();

    const result = await service.getConfigs();
    expect(result).eql({
      resolveConfigs: {},
      commonjsConfigs: {},
    });
  });

  it('#getConfigs (has values)', async () => {
    const { service } = await getData(
      undefined,
      mockProjectService({
        getPackageJson: async () => ({
          rollup: {
            commonjs: { a: 1 },
          },
        }),
      }),
    );

    const result = await service.getConfigs();
    expect(result).eql({
      resolveConfigs: {},
      commonjsConfigs: { a: 1 },
    });
  });

  it('#bundleCode', async () => {
    const { serviceRewiring, service } = await getData(
      undefined,
      undefined,
      // stubs
      {
        getConfigs: async () => ({
          resolveConfigs: { a: 1 },
          commonjsConfigs: { b: 2 },
        }),
      }
    );
    const mockedRollup = serviceRewiring.getModuleMock<MockedRollup>('rollup');

    await service.bundleCode(
      'xxx',
      [
        {
          format: 'umd',
          file: 'xxx',
        },
        {
          format: 'esm',
          file: 'xxx2',
        }
      ]
    );
    const rollupArgs = mockedRollup.getArgs('rollup');
    expect(rollupArgs[0].input).equal('xxx');
    expect(rollupArgs[0].plugins[0]).eql({ a: 1 }, 'resolve');
    expect(rollupArgs[0].plugins[1]).eql({ b: 2 }, 'commonjs');
    expect(mockedRollup.getArgsStack('write')).eql([
      [
        {
          format: 'umd',
          file: 'xxx',
        }
      ],
      [
        {
          format: 'esm',
          file: 'xxx2',
        }
      ]
    ]);

    // clean stub
    serviceRewiring.restoreStubs();
  });

});