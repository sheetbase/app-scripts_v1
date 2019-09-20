// tslint:disable: no-any
import { expect } from 'chai';
import {
  MockBuilder,
  buildMock,
  MethodStubs,
  rewireModule,
} from './index.spec';

import { ProjectService } from '../src/services/project';

// services/file.ts
type MockedFileService = MockBuilder<typeof defaultFileService>;
const defaultFileService = {
  readJson: async () => ({ name: 'xxx' }),
};
function mockFileService(methods = {}) {
  return buildMock(defaultFileService, methods);
}

// prepare test
async function getTestingData(
  mockedFileService?: typeof defaultFileService,  
  methodStubs: MethodStubs = {},
) {
  const moduleRewiring = rewireModule(
    () => import('../src/services/project'),
  );
  // rewire service
  const serviceRewiring = await moduleRewiring.rewireService<ProjectService>(
      'ProjectService',
      {
        fileService: mockedFileService || mockFileService(),
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

describe('services/project.ts', () => {
  
  it('#getPackageJson', async () => {
    const { serviceRewiring, service } = await getTestingData();
    const fileService = serviceRewiring.getServiceMock<MockedFileService>('fileService');

    const result = await service.getPackageJson();
    expect(result).eql({ name: 'xxx' });
    expect(
      fileService.getArgs('readJson'),
    ).eql(['package.json']);
  });

  it('#getConfigs (module)', async () => {
    const { service } = await getTestingData(
      undefined,
      {
        getPackageJson: async () => ({ name: '@sheetbase/xxx' }),
      }
    );

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
    const { service } = await getTestingData(
      undefined,
      {
        getPackageJson: async () => ({ name: '@sheetbase/backend' }),
      }
    );
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
    const { service } = await getTestingData(
      undefined,
      {
        getPackageJson: async () => ({ name: '@app/xxx' }),
      }
    );
    const result = await service.getConfigs();
    expect(result.type).equal('app');
  });

});