// tslint:disable: no-any ban-ts-ignore ban
import { expect } from 'chai';
import {
  mockModule,
  ServiceStubing,
  rewireFull,
} from '@lamnhan/testing';

import { TypedocService } from '../src/services/typedoc';

// ~typedoc
const mockedTypedocModule = {
  '.Application': class {
    args: any[] = [];
    constructor(...args: any[]) { this.args = args; }
  },
};

// setup test
async function setup<
  ServiceStubs extends ServiceStubing<TypedocService>,
>(
  serviceStubs?: ServiceStubs,
) {
  return rewireFull(
    // rewire the module
    '@services/typedoc',
    {
      '~typedoc': mockModule(mockedTypedocModule),
    },
    // rewire the service
    TypedocService,
    undefined,
    serviceStubs
  );
}

describe('services/typedoc.ts', () => {

  it('#getApp (default)', async () => {
    const { service } = await setup();

    const result: any = service.getApp();
    const typedocAppArgs = result.args;
    expect(typedocAppArgs).eql([
      {
        mode: 'file',
        logger: 'none',
        target: 'ES5',
        module: 'CommonJS',
        experimentalDecorators: true,
        ignoreCompilerErrors: true,
      }
    ]);
  });

  it('#getApp (custom)', async () => {
    const { service } = await setup();

    const result: any = service.getApp({
      mode: 'module',
      target: 'ES6',
      module: 'umd',
      ignoreCompilerErrors: false,
    });
    const typedocAppArgs = result.args;
    expect(typedocAppArgs).eql([
      {
        mode: 'module',
        logger: 'none',
        target: 'ES6',
        module: 'umd',
        experimentalDecorators: true,
        ignoreCompilerErrors: false,
      }
    ]);
  });

  it.skip('#generateDocs', async () => {});

  it.skip('#getProject', async () => {});

  it.skip('#getDeclaration', async () => {});

  it.skip('#getInterfaceProps', async () => {});

  it.skip('#getClassMethods', async () => {});

  it.skip('#parseReflection', async () => {});

  it.skip('#parseDeclaration', async () => {});

  it.skip('#parseDeclarationChildren', async () => {});

  it.skip('#parseParameter', async () => {});

  it.skip('#parseSignature', async () => {});

});