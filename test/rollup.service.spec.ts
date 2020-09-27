import {describe, it} from 'mocha';
import {expect} from 'chai';
import {
  ModuleMocking,
  ServiceMocking,
  ServiceStubing,
  mockModule,
  mockService,
  rewireFull,
} from '@lamnhan/testea';

import {RollupService} from '../src/lib/services/rollup.service';

describe('services/rollup.ts', () => {
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
    const {projectServiceMocks = {}} = serviceMocks;
    const {rollupModuleMocks = {}} = moduleMocks;
    return rewireFull(
      // rewire the module
      '@lib/services/rollup',
      {
        '~rollup': mockModule({
          ...mockedRollupModule,
          ...rollupModuleMocks,
        }),
      },
      // rewire the service
      RollupService,
      {
        '@lib/services/project': mockService({
          ...mockedProjectService,
          ...projectServiceMocks,
        }),
      },
      serviceStubs
    ).getResult();
  }

  it('#getConfigs (no values)', async () => {
    const {service} = await setup();

    const result = await service.getConfigs();
    expect(result).eql({
      resolveConfigs: {},
      commonjsConfigs: {},
    });
  });

  it('#getConfigs (has values)', async () => {
    const {service} = await setup(undefined, {
      // remock project service
      projectServiceMocks: {
        getPackageJson: async () => ({
          rollup: {
            commonjs: {a: 1},
          },
        }),
      },
    });

    const result = await service.getConfigs();
    expect(result).eql({
      resolveConfigs: {},
      commonjsConfigs: {a: 1},
    });
  });

  it('#bundleCode', async () => {
    const {
      service,
      mockedModules: {'~rollup': rollupModuleTesting},
    } = await setup({
      getConfigs: async () => ({
        resolveConfigs: {},
        commonjsConfigs: {},
      }),
    });

    await service.bundleCode('xxx', [{format: 'iife', file: 'xxx'}]);
    const rollupArg = rollupModuleTesting.getResult('rollup').getArgFirst();
    expect(rollupArg.input).equal('xxx');
    expect(rollupArg.plugins[0].name).equal('node-resolve');
    expect(rollupArg.plugins[1].name).equal('commonjs');
    expect(rollupModuleTesting.getResult('write').getStackedArgs()).eql([
      [{format: 'iife', file: 'xxx'}],
    ]);
  });
});
