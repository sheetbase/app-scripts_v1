// tslint:disable: no-any
import { expect } from 'chai';
import {
  MockedReturnsValues,
  getModuleRewired,
  setMockedReturnsValues,
} from './index.spec';

class MockedPath {
  // resolve
  resolveArgs: any[] = [];
  resolve(...args: string[]) {
    this.resolveArgs = args;
    return args.join('/');
  }
}

class MockedFSExtra {
  constructor(returnsValues: MockedReturnsValues = {}) {
    setMockedReturnsValues(this, returnsValues);
  }
  // pathExists
  async pathExists() {

  }
  // statSync
  statSync() {

  }
  // readJson
  async readJson() {

  }
  // copy
  async copy() {

  }
  // remove
  async remove() {

  }
  // readFile
  async readFile() {

  }
  // outputFile
  async outputFile() {

  }
}

async function getService(
  mockedPath?: MockedPath,
  mockedFSExtra?: MockedFSExtra
) {
  const m = await getModuleRewired(
    () => import('../src/services/file'),
    {
      'path': mockedPath || new MockedPath(),
      'fs-extra': mockedFSExtra || new MockedFSExtra(),
    }
  );
  return new m.FileService();
}

describe('services/file.ts', () => {

  it('#readFile', async () => {});
  
  it('#outputFile', async () => {});

  it('#readJson', async () => {});
  
  it('#copy', async () => {});
  
  it('#remove', async () => {});

});
