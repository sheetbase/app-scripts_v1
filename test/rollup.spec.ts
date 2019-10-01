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
  RollupModuleMocks extends ModuleMocking<typeof mockedRollupModule>
>(
  serviceStubs?: ServiceStubs,
  serviceMocks: {
    projectServiceMocks?: ProjectServiceMocks;
  } = {},
  moduleMocks: {
    rollupModuleMocks?: RollupModuleMocks;
  } = {}
) {
  const { projectServiceMocks = {} } = serviceMocks;
  const { rollupModuleMocks = {} } = moduleMocks;
  return rewireFull(
    // rewire the module
    '@services/rollup',
    {
      '~rollup': mockModule({
        ...mockedRollupModule,
        ...rollupModuleMocks,
      }),
    },
    // rewire the service
    RollupService,
    {
      '@services/project': mockService({
        ...mockedProjectService,
        ...projectServiceMocks,
      }),
    },
    serviceStubs
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
    const { service } = await setup(undefined, {
      // remock project service
      projectServiceMocks: {
        getPackageJson: async () => ({
          rollup: {
            commonjs: { a: 1 },
          },
        }),
      },
    });

    const result = await service.getConfigs();
    expect(result).eql({
      resolveConfigs: {},
      commonjsConfigs: { a: 1 },
    });
  });

  it('#bundleCode', async () => {
    const {
      service,
      mockedModules: { '~rollup': rollupModuleTesting },
    } = await setup({
      getConfigs: async () => ({
        resolveConfigs: {},
        commonjsConfigs: {},
      }),
    });

    await service.bundleCode('xxx', [
      { format: 'umd', file: 'xxx' },
      { format: 'esm', file: 'xxx2' },
    ]);
    const rollupArg = rollupModuleTesting.getArgFirst('rollup');
    expect(rollupArg.input).equal('xxx');
    expect(rollupArg.plugins[0].name).equal('node-resolve');
    expect(rollupArg.plugins[1].name).equal('commonjs');
    expect(rollupModuleTesting.getStackedArgs('write')).eql([
      [{ format: 'umd', file: 'xxx' }],
      [{ format: 'esm', file: 'xxx2' }],
    ]);
  });
});
