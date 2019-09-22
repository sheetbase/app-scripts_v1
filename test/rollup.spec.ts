// tslint:disable: no-any
import { expect } from 'chai';
import {
  ModuleMocking,
  ServiceMocking,
  ServiceStubing,
  mockModule,
  mockService,
  rewireFull,
} from '@lamnhan/testing';

import { RollupService } from '../src/services/rollup';

// rollup
const mockedRollupModule = {
  rollup: '*',
  write: '*',
};

// @src/services/project
const mockedProjectService = {
  getPackageJson: async () => ({}),
};

// setup test
async function setup<
  ServiceStubs extends ServiceStubing<RollupService>,
  ProjectServiceMocks extends ServiceMocking<typeof mockedProjectService>,
  RollupModuleMocks extends ModuleMocking<typeof mockedRollupModule>,
>(
  serviceStubs?: ServiceStubs,
  projectServiceMocks?: ProjectServiceMocks,
  rollupModuleMocks?: RollupModuleMocks,
) {
  return rewireFull(
    // rewire the module
    () => import('../src/services/rollup'),
    {
      '~rollup': mockModule({
        ...mockedRollupModule,
        ...rollupModuleMocks,
      }),
      '~rollup-plugin-node-resolve': (configs: any) => configs,
      '~rollup-plugin-commonjs': (configs: any) => configs,
    },
    // rewire the service
    RollupService,
    {
      '@services/project': mockService({
        ...mockedProjectService,
        ...projectServiceMocks,
      }),
    },
    serviceStubs,
  );
}

describe('services/rollup.ts', () => {

  it('#getConfigs (no values)', async () => {
    const { service } = await setup();

    const result = await service.getConfigs();
    expect(result).eql({
      resolveConfigs: {},
      commonjsConfigs: {},
    });
  });

  it('#getConfigs (has values)', async () => {
    const { service } = await setup(
      undefined,
      {
        getPackageJson: async () => ({
          rollup: {
            commonjs: { a: 1 },
          },
        }),
      },
    );

    const result = await service.getConfigs();
    expect(result).eql({
      resolveConfigs: {},
      commonjsConfigs: { a: 1 },
    });
  });

  it('#bundleCode', async () => {
    const {
      service,
      mockedModules: {
        '~rollup': rollupModuleTesting,
      }
    } = await setup(
      {
        getConfigs: async () => ({
          resolveConfigs: { a: 1 },
          commonjsConfigs: { b: 2 },
        }),
      }
    );

    await service.bundleCode(
      'xxx', [{ format: 'umd', file: 'xxx' }, { format: 'esm', file: 'xxx2' }]
    );
    const rollupArg = rollupModuleTesting.getArgFirst('rollup');
    expect(rollupArg.input).equal('xxx');
    expect(rollupArg.plugins[0]).eql({ a: 1 }, 'resolve');
    expect(rollupArg.plugins[1]).eql({ b: 2 }, 'commonjs');
    expect(rollupModuleTesting.getStackedArgs('write')).eql([
      [{ format: 'umd', file: 'xxx' }],
      [{ format: 'esm', file: 'xxx2' }]
    ]);
  });

});