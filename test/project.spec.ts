// tslint:disable: no-any
import { expect } from 'chai';
import {
  ServiceMocking,
  ServiceStubing,
  mockService,
  rewireFull,
} from '@lamnhan/testing';

import { ProjectService } from '../src/services/project';

// @src/services/file
const mockedFileService = {
  readJson: async () => ({ name: 'xxx' }),
};

// setup test
async function setup<
  ServiceStubs extends ServiceStubing<ProjectService>,
  FileServiceMocks extends ServiceMocking<typeof mockedFileService>
>(
  serviceStubs?: ServiceStubs,
  serviceMocks: {
    fileServiceMocks?: FileServiceMocks;
  } = {}
) {
  const { fileServiceMocks = {} } = serviceMocks;
  return rewireFull(
    // rewire the module
    '@services/project',
    undefined,
    // rewire the service
    ProjectService,
    {
      '@services/file': mockService({
        ...mockedFileService,
        ...fileServiceMocks,
      }),
    },
    serviceStubs
  );
}

describe('services/project.ts', () => {
  it('#getPackageJson', async () => {
    const {
      service,
      mockedServices: { '@services/file': fileServiceTesting },
    } = await setup();

    const result = await service.getPackageJson();
    expect(result).eql({ name: 'xxx' });
    expect(fileServiceTesting.getArgs('readJson')).eql(['package.json']);
  });

  it('#getConfigs (module)', async () => {
    const { service } = await setup({
      getPackageJson: async () => ({ name: '@sheetbase/xxx' }),
    });

    const result = await service.getConfigs();
    expect(result).eql({
      type: 'module',
      name: 'xxx',
      fullName: 'sheetbase-xxx',
      inputPath: './dist/esm3/public-api.js',
      umdPath: './dist/bundles/sheetbase-xxx.js',
      umdName: 'Xxx',
      esmPath: './dist/fesm3/sheetbase-xxx.js',
      typingsPath: './dist/sheetbase-xxx.d.ts',
    });
  });

  it('#getConfigs (app 1)', async () => {
    const { service } = await setup({
      getPackageJson: async () => ({ name: '@sheetbase/backend' }),
    });
    const result = await service.getConfigs();
    expect(result).eql({
      type: 'app',
      name: 'backend',
      fullName: 'sheetbase-backend',
      inputPath: './dist/index.js',
      umdPath: './dist/app.js',
      umdName: 'App',
    });
  });

  it('#getConfigs (app 2)', async () => {
    const { service } = await setup({
      getPackageJson: async () => ({ name: '@app/xxx' }),
    });
    const result = await service.getConfigs();
    expect(result.type).equal('app');
  });
});
