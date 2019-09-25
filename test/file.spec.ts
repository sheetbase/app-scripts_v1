// tslint:disable: no-any
import { expect } from 'chai';
import { ModuleMocking, mockModule, rewireFull } from '@lamnhan/testing';

import { FileService } from '../src/services/file';

// path
const mockedPathModule = {
  resolve: (...args: string[]) => args.join('/'),
};

// fs-extra
const mockedFSExtra = {
  pathExists: async () => true,
  statSync: (path: string) => ({ isDirectory: () => path.indexOf('.') === -1 }),
  readJson: async () => ({ a: 1 }),
  copy: async () => undefined,
  remove: async () => undefined,
  readFile: async () => 'xxx',
  outputFile: async () => undefined,
};

// setup test
async function setup<
  FSExtraModuleMocks extends ModuleMocking<typeof mockedFSExtra>
>(
  moduleMocks: {
    fsExtraModuleMocks?: FSExtraModuleMocks;
  } = {}
) {
  const { fsExtraModuleMocks = {} } = moduleMocks;
  return rewireFull(
    // rewire the module
    '@services/file',
    {
      path: mockModule(mockedPathModule),
      '~fs-extra': mockModule({
        ...mockedFSExtra,
        ...fsExtraModuleMocks,
      }),
    },
    // rewire the service
    FileService
  );
}

describe('services/file.ts', () => {
  it('#readFile', async () => {
    const {
      service,
      mockedModules: { '~fs-extra': fsExtraModuleTesting },
    } = await setup();

    const result = await service.readFile('xxx.txt');
    expect(result).equal('xxx');
    expect(fsExtraModuleTesting.getArgs('readFile')).eql(['xxx.txt', 'utf-8']);
  });

  it('#outputFile', async () => {
    const {
      service,
      mockedModules: { '~fs-extra': fsExtraModuleTesting },
    } = await setup();

    const result = await service.outputFile('xxx.txt', 'abc');
    expect(fsExtraModuleTesting.getArgs('outputFile')).eql(['xxx.txt', 'abc']);
  });

  it('#readJson', async () => {
    const {
      service,
      mockedModules: { '~fs-extra': fsExtraModuleTesting },
    } = await setup();

    const result = await service.readJson('xxx.json');
    expect(result).eql({ a: 1 });
    expect(fsExtraModuleTesting.getArgs('readJson')).eql(['xxx.json']);
  });

  it('#copy (empty src)', async () => {
    const {
      service,
      mockedModules: { '~fs-extra': fsExtraModuleTesting },
    } = await setup();

    const result = await service.copy([], 'dest');
    const copyArgs = fsExtraModuleTesting.getArgs('copy');
    expect(copyArgs).equal(undefined);
  });

  it('#copy (src in valid)', async () => {
    const {
      service,
      mockedModules: { '~fs-extra': fsExtraModuleTesting },
    } = await setup();

    const result = await service.copy([''], 'dest');
    const copyArgs = fsExtraModuleTesting.getArgs('copy');
    expect(copyArgs).equal(undefined);
  });

  it('#copy (src not exists)', async () => {
    const {
      service,
      mockedModules: { '~fs-extra': fsExtraModuleTesting },
    } = await setup({
      // remock fs-extra module
      fsExtraModuleMocks: {
        pathExists: async () => false,
      },
    });

    const result = await service.copy(['xxx.txt'], 'dest');
    const copyArgs = fsExtraModuleTesting.getArgs('copy');
    expect(copyArgs).equal(undefined);
  });

  it('#copy', async () => {
    const {
      service,
      mockedModules: { '~fs-extra': fsExtraModuleTesting },
    } = await setup();

    const result = await service.copy(
      [
        'xxx', // top level folder
        'xxx.txt', // top level file
        'src/xxx', // nested folder
        'src/xxx/abc.txt', // nested file
        'src\\xxx\\abc.txt', // Windows path
      ],
      'dest'
    );
    const copyStackedArgs = fsExtraModuleTesting.getStackedArgs('copy');
    expect(copyStackedArgs).eql([
      ['xxx', 'dest/'],
      ['xxx.txt', 'dest/xxx.txt'],
      ['src/xxx', 'dest/'],
      ['src/xxx/abc.txt', 'dest/abc.txt'],
      ['src/xxx/abc.txt', 'dest/abc.txt'],
    ]);
  });

  it('#remove', async () => {
    const {
      service,
      mockedModules: { '~fs-extra': fsExtraModuleTesting },
    } = await setup();

    const result = await service.remove('xxx.txt');
    expect(fsExtraModuleTesting.getArgs('remove')).eql(['xxx.txt']);
  });
});
