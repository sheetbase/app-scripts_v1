// tslint:disable: no-any ban-ts-ignore
import { expect } from 'chai';
import {
  MockBuilder,
  ServiceMocking,
  mockModule,
  mockService,
  ServiceStubing,
  rewireFull,
} from '@lamnhan/testing';

import { BuildCommand } from '../src/commands/build';

// path
const mockedPathModule = {
  resolve: (p1: string, p2: string) => !p2 ? p1 : p1 + '/' + p2,
};

// child_process
const mockedChildProcessModule = {
  execSync: '...',
};

// @services/content
const mockedContentService = {

};

// @services/file
const mockedFileService = {
  outputFile: '*...',
};

// @services/message
const mockedMessageService = {

};

// @services/project
const mockedProjectService = {

};

// @services/rollup
const mockedRollupService = {

};

// setup test
async function setup<
  ServiceStubs extends ServiceStubing<BuildCommand>,
  ContentServiceMocks extends ServiceMocking<typeof mockedContentService>,
  FileServiceMocks extends ServiceMocking<typeof mockedFileService>,
  MessageServiceMocks extends ServiceMocking<typeof mockedMessageService>,
  ProjectServiceMocks extends ServiceMocking<typeof mockedProjectService>,
  RollupServiceMocks extends ServiceMocking<typeof mockedRollupService>,
>(
  serviceStubs?: ServiceStubs,
  contentServiceMocks?: ContentServiceMocks,
  fileServiceMocks?: FileServiceMocks,
  messageServiceMocks?: MessageServiceMocks,
  projectServiceMocks?: ProjectServiceMocks,
  rollupServiceMocks?: RollupServiceMocks,
) {
  return rewireFull(
    // rewire the module
    '@commands/build',
    {
      'path': mockModule(mockedPathModule),
      'child_process': mockModule(mockedChildProcessModule)
    },
    // rewire the service
    BuildCommand,
    {
      '@services/content': mockService({
        ...mockedContentService,
        ...contentServiceMocks,
      }),
      '@services/file': mockService({
        ...mockedFileService,
        ...fileServiceMocks,
      }),
      '@services/message': mockService({
        ...mockedMessageService,
        ...messageServiceMocks,
      }),
      '@services/project': mockService({
        ...mockedProjectService,
        ...projectServiceMocks,
      }),
      '@services/rollup': mockService({
        ...mockedRollupService,
        ...rollupServiceMocks,
      }),
    },
    serviceStubs,
  );
}

describe('commands/build.ts', () => {

  it('service instances', async () => {
    const { service } = await setup();

    expect(
      // @ts-ignore
      service.contentService instanceof MockBuilder,
    ).equal(true, '@service/content');
    expect(
      // @ts-ignore
      service.fileService instanceof MockBuilder,
    ).equal(true, '@service/file');
    expect(
      // @ts-ignore
      service.messageService instanceof MockBuilder,
    ).equal(true, '@service/message');
    expect(
      // @ts-ignore
      service.projectService instanceof MockBuilder,
    ).equal(true, '@service/project');
    expect(
      // @ts-ignore
      service.rollupService instanceof MockBuilder,
    ).equal(true, '@service/rollup');
  });

  it('props', async () => {
    const { service } = await setup();

    expect(service.DIST_DIR).equal('dist');
    expect(service.DEPLOY_DIR).equal('deploy');
  });

  // it('#build', async () => {});

  it('#compileCode', async () => {
    const { service } = await setup();

    const result = service.compileCode();
    expect(result).eql([
      `tsc -p .`, { stdio: 'ignore' },
    ]);
  });

  // it('#bundleCode', async () => {});

  // it('#buildModule', async () => {});

  // it('#moduleSaveTypings', async () => {});

  // it('#buildApp', async () => {});

  it('#appSaveIndex', async () => {
    const { service } = await setup();

    const result = await service.appSaveIndex();
    expect(result).eql([
      'deploy/@index.js',
      '// A Sheetbase Application'
    ]);
  });

  // it('#appSaveMain', async () => {});

  // it('#appCopyResources', async () => {});

  // it('#appSaveVendor', async () => {});

});
