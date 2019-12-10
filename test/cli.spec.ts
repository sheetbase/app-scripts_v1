// tslint:disable: no-any
import { expect } from 'chai';
import * as sinon from 'sinon';
import { mockModule, rewireFull } from '@lamnhan/testing';

import { CLI } from '../src/cli/index';

// commander
const mockedCommanderModule = {
  version: '*',
  usage: '*',
  description: '*',
  command: '*',
  option: '*',
  action: '*',
  outputHelp: '#outputHelp',
};

// @commands/build
class MockedBuildCommand {
  async build(options: any) {
    return { build: options };
  }
}

// @commands/docs
class MockedDocsCommand {
  async docs() {
    return { docs: true };
  }
}

// setup test
async function setup() {
  return rewireFull(
    // rewire the module
    '@src/cli',
    {
      '~commander': mockModule(mockedCommanderModule),
      '@services/file': { FileService: class {} },
      '@services/message': { MessageService: class {} },
      '@services/typedoc': { TypedocService: class {} },
      '@services/project': { ProjectService: class {} },
      '@services/rollup': { RollupService: class {} },
      '@services/content': { ContentService: class {} },
      '@commands/build': { BuildCommand: MockedBuildCommand },
      '@commands/docs': { DocsCommand: MockedDocsCommand },
    },
    // rewire the service
    CLI
  );
}

describe('cli.ts', () => {
  it('#cli', async () => {
    const {
      mockedModules: { '~commander': commanderModuleTesting },
      service,
    } = await setup();

    const result = service.getApp();
    // retrieve data
    const versionArgs = commanderModuleTesting.getArgs('version');
    const usageArgs = commanderModuleTesting.getArgs('usage');
    const descriptionStkArgs = commanderModuleTesting.getStackedArgs(
      'description'
    );
    const commandStkArgs = commanderModuleTesting.getStackedArgs('command');
    const optionStkArgs = commanderModuleTesting.getStackedArgs('option');
    const buildCommand = commanderModuleTesting.getArgInStack('action', 1, 1);
    const docsCommand = commanderModuleTesting.getArgInStack('action', 2, 1);
    const helpCommand = commanderModuleTesting.getArgInStack('action', 3, 1);
    const anyCommand = commanderModuleTesting.getArgInStack('action', 4, 1);
    // commander data
    expect(versionArgs).eql(['2.0.0-beta.1', '-v, --version']);
    expect(usageArgs).eql(['sheetbase-app-scripts [options] [command]']);
    expect(descriptionStkArgs).eql([
      ['Scripts for Sheetbase backend modules and apps.'],
      ['Build distribution package.'],
      ['Generate the documentation.'],
      ['Display help.'],
      ['Any other command is not supported.'],
    ]);
    expect(commandStkArgs).eql([['build'], ['docs'], ['help'], ['*']]);
    expect(optionStkArgs).eql([
      // build command
      ['--copy [value]', 'Copied resources, comma-seperated.'],
      ['--vendor [value]', 'Files for @vendor.js, comma-seperated.'],
    ]);
    // build command result
    const buildCommandResult = await buildCommand('xxx');
    expect(buildCommandResult).eql({ build: 'xxx' });
    // docs command result
    const docsCommandResult = await docsCommand();
    expect(docsCommandResult).eql({ docs: true });
    // help command result
    const helpCommandResult = await helpCommand();
    expect(helpCommandResult).equal('#outputHelp');
    // * command result
    const errorStub = sinon.stub(console, 'error').callsFake(value => value);
    const anyCommandResult = await anyCommand('xxx');
    expect(anyCommandResult).equal(
      `\u001b[31mUnknown command \'xxx\'\u001b[39m`
    );
    errorStub.restore();
  });
});
