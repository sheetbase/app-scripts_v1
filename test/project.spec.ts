// tslint:disable: no-any
import { expect } from 'chai';
import {
  MockedReturnsValues,
  getModuleRewired,
  setMockedReturnsValues,
} from './index.spec';

class MockedFileService {}

async function getService(
  mockedFileService?: MockedFileService,
) {
  const m = await getModuleRewired(
    () => import('../src/services/project'),
  );
  return new m.ProjectService(
    mockedFileService ||
    new MockedFileService() as any,
  );
}

describe('services/project.ts', () => {
  
  it('#getPackageJson', async () => {});

  it('#getConfigs', async () => {});  

});