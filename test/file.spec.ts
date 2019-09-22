// tslint:disable: no-any
import { expect } from 'chai';
import {
  ModuleMocking,
  mockModule,
  rewireFull,
} from '@lamnhan/testing';

import { FileService } from '../src/services/file';

// path
const mockedPathModule = {
  resolve: '/',
};

// fs-extra
const mockedFSExtra = {
  pathExists: async () => true,
  statSync: () => ({ isDirectory: () => true }),
  readJson: async () => ({ a: 1 }),
  copy: async () => undefined,
  remove: async () => undefined,
  readFile: async () => 'xxx',
  outputFile: async () => undefined,
};

// setup test
async function setup<
  FSExtraModuleMocks extends ModuleMocking<typeof mockedFSExtra>,
>(
  fsExtraModuleMocks?: FSExtraModuleMocks,
) {
  return rewireFull(
    // rewire the module
    () => import('../src/services/file'),
    {
      'path': mockModule(mockedPathModule),
      '~fs-extra': mockModule({
        ...mockedFSExtra,
        ...fsExtraModuleMocks
      })
    },
    // rewire the service
    FileService,
  );
}

describe('services/file.ts', () => {

  it('#readFile', async () => {
    const {
      service,
      mockedModules: {
        '~fs-extra': fsExtraModuleTesting,
      }
    } = await setup();

    const result = await service.readFile('xxx.txt');
    expect(result).equal('xxx');
    expect(
      fsExtraModuleTesting.getArgs('readFile'),
    ).eql([
      'xxx.txt', 'utf-8',
    ]);
  });
  
  it('#outputFile', async () => {
    const {
      service,
      mockedModules: {
        '~fs-extra': fsExtraModuleTesting,
      }
    } = await setup();

    const result = await service.outputFile('xxx.txt', 'abc');
    expect(
      fsExtraModuleTesting.getArgs('outputFile'),
    ).eql([
      'xxx.txt', 'abc',
    ]);
  });

  it('#readJson', async () => {
    const {
      service,
      mockedModules: {
        '~fs-extra': fsExtraModuleTesting,
      }
    } = await setup();

    const result = await service.readJson('xxx.json');
    expect(result).eql({ a: 1 });
    expect(
      fsExtraModuleTesting.getArgs('readJson'),
    ).eql([
      'xxx.json',
    ]);
  });
  
  it('#copy', async () => {});
  
  it('#remove', async () => {
    const {
      service,
      mockedModules: {
        '~fs-extra': fsExtraModuleTesting,
      }
    } = await setup();

    const result = await service.remove('xxx.txt');
    expect(
      fsExtraModuleTesting.getArgs('remove'),
    ).eql([
      'xxx.txt',
    ]);
  });

});
