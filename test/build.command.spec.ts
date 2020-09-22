/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {
  MockBuilder,
  ServiceMocking,
  mockModule,
  mockService,
  ServiceStubing,
  rewireFull,
} from '@lamnhan/testea';

import {BuildCommand} from '../src/cli/commands/build.command';

describe('commands/build.ts', () => {
  // path
  const mockedPathModule = {
    resolve: (...args: string[]) => args.join('/'),
  };

  // child_process
  const mockedChildProcessModule = {
    execSync: '...',
  };

  // @services/file
  const mockedFileService = {
    readFile: async () => 'xxx',
    outputFile: '...$',
    copy: '...$',
    remove: async () => undefined,
  };

  // @services/message
  const mockedMessageService = {
    logOk: '.',
  };

  // @services/project
  const mockedProjectService = {
    getConfigs: async () => ({}),
  };

  // @services/rollup
  const mockedRollupService = {
    bundleCode: '...$',
  };

  // setup test
  async function setup<
    ServiceStubs extends ServiceStubing<BuildCommand>,
    FileServiceMocks extends ServiceMocking<typeof mockedFileService>,
    MessageServiceMocks extends ServiceMocking<typeof mockedMessageService>,
    ProjectServiceMocks extends ServiceMocking<typeof mockedProjectService>,
    RollupServiceMocks extends ServiceMocking<typeof mockedRollupService>
  >(
    serviceStubs?: ServiceStubs,
    serviceMocks: {
      fileServiceMocks?: FileServiceMocks;
      messageServiceMocks?: MessageServiceMocks;
      projectServiceMocks?: ProjectServiceMocks;
      rollupServiceMocks?: RollupServiceMocks;
    } = {}
  ) {
    const {
      fileServiceMocks = {},
      messageServiceMocks = {},
      projectServiceMocks = {},
      rollupServiceMocks = {},
    } = serviceMocks;
    return rewireFull(
      // rewire the module
      '@/cli/commands/build',
      {
        path: mockModule(mockedPathModule),
        child_process: mockModule(mockedChildProcessModule),
      },
      // rewire the service
      BuildCommand,
      {
        '@lib/services/file': mockService({
          ...mockedFileService,
          ...fileServiceMocks,
        }),
        '@lib/services/message': mockService({
          ...mockedMessageService,
          ...messageServiceMocks,
        }),
        '@lib/services/project': mockService({
          ...mockedProjectService,
          ...projectServiceMocks,
        }),
        '@lib/services/rollup': mockService({
          ...mockedRollupService,
          ...rollupServiceMocks,
        }),
      },
      serviceStubs
    ).getResult();
  }

  it('service instances', async () => {
    const {service} = await setup();

    expect(
      // @ts-ignore
      service.fileService instanceof MockBuilder
    ).equal(true, '@service/file');
    expect(
      // @ts-ignore
      service.messageService instanceof MockBuilder
    ).equal(true, '@service/message');
    expect(
      // @ts-ignore
      service.projectService instanceof MockBuilder
    ).equal(true, '@service/project');
    expect(
      // @ts-ignore
      service.rollupService instanceof MockBuilder
    ).equal(true, '@service/rollup');
  });

  it('props', async () => {
    const {service} = await setup();

    expect(service.DIST_DIR).equal('dist');
    expect(service.DEPLOY_DIR).equal('deploy');
  });

  it('#run (module)', async () => {
    let compileCodeCalled = false;
    let bundleCodeArgs: any[] = [];
    let buildModuleArgs: any[] = [];
    let buildAppArgs: any[] = [];

    const getConfigsMockedReturns = {
      type: 'module',
      umdPath: 'xxx.umd.js',
      typingsPath: 'xxx.d.ts',
    };
    const {service} = await setup(
      {
        compileCode: async () => (compileCodeCalled = true),
        bundleCode: async (...args: any[]) => (bundleCodeArgs = args),
        buildModule: async (...args: any[]) => (buildModuleArgs = args),
        buildApp: async (...args: any[]) => (buildAppArgs = args),
      },
      {
        projectServiceMocks: {
          getConfigs: async () => getConfigsMockedReturns,
        },
      }
    );

    const result = await service.run({});
    expect(compileCodeCalled).equal(true);
    expect(bundleCodeArgs).eql([getConfigsMockedReturns]);
    expect(buildModuleArgs).eql(['xxx.d.ts']);
    expect(buildAppArgs).eql([]);
    expect(result).equal('Build module completed.');
  });

  it('#run (app)', async () => {
    let compileCodeCalled = false;
    let bundleCodeArgs: any[] = [];
    let buildModuleArgs: any[] = [];
    let buildAppArgs: any[] = [];

    const getConfigsMockedReturns = {
      type: 'app',
      umdPath: 'xxx.umd.js',
      typingsPath: 'xxx.d.ts',
    };
    const {service} = await setup(
      {
        compileCode: async () => (compileCodeCalled = true),
        bundleCode: async (...args: any[]) => (bundleCodeArgs = args),
        buildModule: async (...args: any[]) => (buildModuleArgs = args),
        buildApp: async (...args: any[]) => (buildAppArgs = args),
      },
      {
        projectServiceMocks: {
          getConfigs: async () => getConfigsMockedReturns,
        },
      }
    );

    const result = await service.run({
      copy: 'src/xxx',
      vendor: 'src/xxx.js',
    });
    expect(compileCodeCalled).equal(true);
    expect(bundleCodeArgs).eql([getConfigsMockedReturns]);
    expect(buildModuleArgs).eql([]);
    expect(buildAppArgs).eql(['xxx.umd.js', 'src/xxx', 'src/xxx.js']);
    expect(result).equal('Build app completed.');
  });

  it('#compileCode', async () => {
    const {service} = await setup();

    const result = service.compileCode();
    expect(result).eql(['npx tsc -p .', {stdio: 'ignore'}]);
  });

  it('#bundleCode (app)', async () => {
    const {service} = await setup();

    const result = await service.bundleCode({
      type: 'app',
      inputPath: 'xxx.js',
      umdPath: 'xxx.umd.js',
      umdName: 'Xxx',
    } as any);
    expect(result).eql([
      // input
      'xxx.js',
      // output
      [
        {
          format: 'umd',
          file: 'xxx.umd.js',
          name: 'Xxx',
          sourcemap: false,
        },
      ],
    ]);
  });

  it('#bundleCode (module)', async () => {
    const {service} = await setup();

    const result = await service.bundleCode({
      type: 'module',
      inputPath: 'xxx.js',
      umdPath: 'xxx.umd.js',
      umdName: 'Xxx',
      esmPath: 'xxx.esm.js',
    } as any);
    expect(result).eql([
      // input
      'xxx.js',
      // output
      [
        {
          format: 'umd',
          file: 'xxx.umd.js',
          name: 'Xxx',
          sourcemap: true,
        },
        {
          format: 'esm',
          sourcemap: true,
          file: 'xxx.esm.js',
        },
      ],
    ]);
  });

  it('#buildModule', async () => {
    let moduleSaveTypingsArgs: any[] = [];

    const {service} = await setup({
      moduleSaveTypings: async (...args: any[]) =>
        (moduleSaveTypingsArgs = args),
    });

    const result = await service.buildModule('xxx.d.ts');
    expect(moduleSaveTypingsArgs).eql(['xxx.d.ts']);
  });

  it('#moduleSaveTypings', async () => {
    const {service} = await setup();

    const result = await service.moduleSaveTypings('xxx.d.ts');
    expect(result).eql(['xxx.d.ts', "export * from './src/public-api';"]);
  });

  it('#buildApp', async () => {
    let appSaveIndexCalled = false;
    let appSaveMainArgs: any[] = [];
    let appCopyResourcesArgs: any[] = [];
    let appSaveVendorArgs: any[] = [];

    const {
      service,
      mockedServices: {'@lib/services/file': fileServiceTesting},
    } = await setup({
      appSaveIndex: async () => (appSaveIndexCalled = true),
      appSaveMain: async (...args: any[]) => (appSaveMainArgs = args),
      appCopyResources: async (...args: any[]) => (appCopyResourcesArgs = args),
      appSaveVendor: async (...args: any[]) => (appSaveVendorArgs = args),
    });

    const result = await service.buildApp(
      'xxx.umd.js',
      'src/xxx',
      'src/xxx.js'
    );
    const removeStackedArgs = fileServiceTesting
      .getResult('remove')
      .getStackedArgs();
    expect(removeStackedArgs).eql([['deploy'], ['dist']]);
    expect(appSaveIndexCalled).equal(true);
    expect(appSaveMainArgs).eql(['xxx.umd.js']);
    expect(appCopyResourcesArgs).eql(['src/xxx']);
    expect(appSaveVendorArgs).eql(['src/xxx.js']);
  });

  it('#appSaveIndex', async () => {
    const {service} = await setup();

    const result = await service.appSaveIndex();
    expect(result).eql(['deploy/@index.js', '// A Sheetbase Application']);
  });

  it('#appSaveMain', async () => {
    const {
      service,
      mockedServices: {'@lib/services/file': fileServiceTesting},
    } = await setup();

    const result = await service.appSaveMain('xxx.umd.js');
    const readFileArg = fileServiceTesting.getResult('readFile').getArgFirst();
    expect(readFileArg).equal('xxx.umd.js');
    expect(result).eql([
      'deploy/@app.js',
      [
        'xxx',
        '',
        'function doGet(e) { return App.Server.HTTP.get(e); }',
        'function doPost(e) { return App.Server.HTTP.post(e); }',
      ].join('\n'),
    ]);
  });

  it('#appCopyResources (no input)', async () => {
    const {service} = await setup();

    const result = await service.appCopyResources(undefined as any);
    expect(result).eql([
      ['.clasp.json', 'appsscript.json', 'src/views'],
      'deploy',
    ]);
  });

  it('#appCopyResources (invalid input)', async () => {
    const {service} = await setup();

    const result = await service.appCopyResources(', , ');
    expect(result).eql([
      ['.clasp.json', 'appsscript.json', 'src/views'],
      'deploy',
    ]);
  });

  it('#appCopyResources (valid input)', async () => {
    const {service} = await setup();

    const result = await service.appCopyResources('abc.txt, src/xxx,xxx.xyz ');
    expect(result).eql([
      [
        '.clasp.json',
        'appsscript.json',
        'src/views',
        'abc.txt',
        'src/xxx',
        'xxx.xyz',
      ],
      'deploy',
    ]);
  });

  it('#appSaveVendor (no input)', async () => {
    const {service} = await setup();

    const result = await service.appSaveVendor(undefined as any);
    expect(result).equal(undefined);
  });

  it('#appSaveVendor (invalid input)', async () => {
    const {service} = await setup();

    const result = await service.appSaveVendor(', , ');
    expect(result).equal(undefined);
  });

  it('#appSaveVendor (valid input)', async () => {
    const {
      service,
      mockedServices: {'@lib/services/file': fileServiceTesting},
    } = await setup();

    const result = await service.appSaveVendor(
      'xxx.js,src/xxx.js,@xxx.js,@/xxx.js,~xxx/xxx.js,~/xxx/xxx.js'
    );
    const readFileStackedArgs = fileServiceTesting
      .getResult('readFile')
      .getStackedArgs();
    expect(readFileStackedArgs).eql([
      ['xxx.js'],
      ['src/xxx.js'],
      ['src/xxx.js'],
      ['src/xxx.js'],
      ['node_modules/xxx/xxx.js'],
      ['node_modules/xxx/xxx.js'],
    ]);
    expect(result).eql([
      'deploy/@vendor.js',
      [
        '// xxx.js',
        'xxx',
        '',
        '// src/xxx.js',
        'xxx',
        '',
        '// src/xxx.js',
        'xxx',
        '',
        '// src/xxx.js',
        'xxx',
        '',
        '// node_modules/xxx/xxx.js',
        'xxx',
        '',
        '// node_modules/xxx/xxx.js',
        'xxx',
      ].join('\n'),
    ]);
  });
});
