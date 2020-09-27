import {describe, it} from 'mocha';
import {expect} from 'chai';
import {ModuleMocking, mockModule, rewireFull} from '@lamnhan/testea';

import {FileService} from '../src/lib/services/file.service';

describe('services/file.ts', () => {
  // path
  const mockedPathModule = {
    resolve: (...args: string[]) => args.join('/'),
  };

  // fs-extra
  const mockedFSExtra = {
    pathExists: async () => true,
    statSync: (path: string) => ({isDirectory: () => path.indexOf('.') === -1}),
    readJson: async () => ({a: 1}),
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
    const {fsExtraModuleMocks = {}} = moduleMocks;
    return rewireFull(
      // rewire the module
      '@lib/services/file',
      {
        path: mockModule(mockedPathModule),
        '~fs-extra': mockModule({
          ...mockedFSExtra,
          ...fsExtraModuleMocks,
        }),
      },
      // rewire the service
      FileService
    ).getResult();
  }

  it('#readFile', async () => {
    const {
      service,
      mockedModules: {'~fs-extra': fsExtraModuleTesting},
    } = await setup();

    const result = await service.readFile('xxx.txt');
    expect(result).equal('xxx');
    expect(fsExtraModuleTesting.getResult('readFile').getArgs()).eql([
      'xxx.txt',
      'utf-8',
    ]);
  });

  it('#outputFile', async () => {
    const {
      service,
      mockedModules: {'~fs-extra': fsExtraModuleTesting},
    } = await setup();

    const result = await service.outputFile('xxx.txt', 'abc');
    expect(fsExtraModuleTesting.getResult('outputFile').getArgs()).eql([
      'xxx.txt',
      'abc',
    ]);
  });

  it('#readJson', async () => {
    const {
      service,
      mockedModules: {'~fs-extra': fsExtraModuleTesting},
    } = await setup();

    const result = await service.readJson('xxx.json');
    expect(result).eql({a: 1});
    expect(fsExtraModuleTesting.getResult('readJson').getArgs()).eql([
      'xxx.json',
    ]);
  });

  it('#copy (empty src)', async () => {
    const {
      service,
      mockedModules: {'~fs-extra': fsExtraModuleTesting},
    } = await setup();

    const result = await service.copy([], 'dest');
    const copyArgs = fsExtraModuleTesting.getResult('copy').getArgs();
    expect(copyArgs).eql([]);
  });

  it('#copy (src in valid)', async () => {
    const {
      service,
      mockedModules: {'~fs-extra': fsExtraModuleTesting},
    } = await setup();

    const result = await service.copy([''], 'dest');
    const copyArgs = fsExtraModuleTesting.getResult('copy').getArgs();
    expect(copyArgs).eql([]);
  });

  it('#copy (src not exists)', async () => {
    const {
      service,
      mockedModules: {'~fs-extra': fsExtraModuleTesting},
    } = await setup({
      // remock fs-extra module
      fsExtraModuleMocks: {
        pathExists: async () => false,
      },
    });

    const result = await service.copy(['xxx.txt'], 'dest');
    const copyArgs = fsExtraModuleTesting.getResult('copy').getArgs();
    expect(copyArgs).eql([]);
  });

  it('#copy', async () => {
    const {
      service,
      mockedModules: {'~fs-extra': fsExtraModuleTesting},
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
    const copyStackedArgs = fsExtraModuleTesting
      .getResult('copy')
      .getStackedArgs();
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
      mockedModules: {'~fs-extra': fsExtraModuleTesting},
    } = await setup();

    const result = await service.remove('xxx.txt');
    expect(fsExtraModuleTesting.getResult('remove').getArgs()).eql(['xxx.txt']);
  });
});
