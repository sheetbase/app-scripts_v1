// tslint:disable: no-any ban-ts-ignore ban
import { expect } from 'chai';
import {
  MockBuilder,
  ServiceMocking,
  mockModule,
  mockService,
  ServiceStubing,
  rewireFull,
} from '@lamnhan/testing';

import { ContentService } from '../src/services/content';

// os
const mockedOsModule = {
  '.EOL': '\n',
};

// path
const mockedPathModule = {
  resolve: (...args: string[]) => args.join('/'),
};

// ~prettier
const mockedPrettierModule = {};

// ~match-all
const mockedMatchAllModule = (...args: any[]) => ({
  toArray: () => args,
});

// @services/file
const mockedFileService = {};

// @services/typedoc
const mockedTypedocService = {
  bundleCode: '*...',
};

// setup test
async function setup<
  ServiceStubs extends ServiceStubing<ContentService>,
  FileServiceMocks extends ServiceMocking<typeof mockedFileService>,
  TypedocServiceMocks extends ServiceMocking<typeof mockedTypedocService>
>(
  serviceStubs?: ServiceStubs,
  serviceMocks: {
    fileServiceMocks?: FileServiceMocks,
    typedocServiceMocks?: TypedocServiceMocks
  } = {},
) {
  const {
    fileServiceMocks = {},
    typedocServiceMocks = {},
  } = serviceMocks;
  return rewireFull(
    // rewire the module
    '@services/content',
    {
      os: mockModule(mockedOsModule),
      path: mockModule(mockedPathModule),
      '~prettier': mockModule(mockedPrettierModule),
      '~match-all': mockModule(mockedMatchAllModule),
    },
    // rewire the service
    ContentService,
    {
      '@services/file': mockService({
        ...mockedFileService,
        ...fileServiceMocks,
      }),
      '@services/typedoc': mockService({
        ...mockedTypedocService,
        ...typedocServiceMocks,
      }),
    },
    serviceStubs
  );
}

describe('services/content.ts', () => {

  it('service instances', async () => {
    const { service } = await setup();

    expect(
      // @ts-ignore
      service.fileService instanceof MockBuilder
    ).equal(true, '@service/file');
    expect(
      // @ts-ignore
      service.typedocService instanceof MockBuilder
    ).equal(true, '@service/typedoc');
  });

  it('props', async () => {
    const { service } = await setup();

    expect(service.EOL).equal('\n');
    expect(service.EOL2X).equal('\n\n');
  });

  it('#eol', async () => {
    const { service } = await setup();

    const result = service.eol(3);
    expect(result).equal('\n\n\n');
  });

  it.skip('#stringBetween', async () => {});

  it.skip('#escapeMDTableContent', async () => {});

  it.skip('#formatMDContent', async () => {});

  it.skip('#getReadmeSections', async () => {});

  it.skip('#buildMDSummary', async () => {});

  it.skip('#getOptionsInterfaceMD', async () => {});

  it.skip('#getMainClassFullMD', async () => {});

  it.skip('#getMainClassSummaryMD', async () => {});

  it.skip('#getMainClassDetailMD', async () => {});

  it.skip('#getRoutingInfoFullMD', async () => {});

  it.skip('#getRoutingInfoSummaryMD', async () => {});

  it.skip('#getRoutingInfoDetailMD', async () => {});

});