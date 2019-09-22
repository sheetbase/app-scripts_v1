// tslint:disable: no-any
import { expect } from 'chai';
import * as sinon from 'sinon';
import { mockModule, rewireFull } from '@lamnhan/testing';

import { CLIApp } from '../src/cli';

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

// @src/commands/build
class MockedBuildCommand {
  async build(options: any) {
    return { build: options };
  }
}

// @src/commands/docs
class MockedDocsCommand {
  async docs() {
    return { docs: true };
  }
}

// setup test
async function setup() {
  return rewireFull(
    // rewire the module
    () => import('../src/cli'),
    {
      'commander': mockModule(mockedCommanderModule),
      '@src/services/file': { FileService: class {} },
      '@src/services/message': { MessageService: class {} },
      '@src/services/typedoc': { TypedocService: class {} },
      '@src/services/project': { ProjectService: class {} },
      '@src/services/rollup': { RollupService: class {} },
      '@src/services/content': { ContentService: class {} },
      '@src/commands/build': { BuildCommand: MockedBuildCommand },
      '@src/commands/docs': { DocsCommand: MockedDocsCommand },
    },
    // rewire the service
    CLIApp,
  );
}

describe('cli.ts', () => {

  it('#cli', async () => {
    const {
      mockedModules: {
        commander: commanderTesting,
      },
      service,
    } = await setup();

    const result = service.getApp();
    // retrieve data
    const versionArgs = commanderTesting.getArgs('version');
    const usageArgs = commanderTesting.getArgs('usage');
    const descriptionStackedArgs = commanderTesting.getStackedArgs('description');
    const commandStackedArgs = commanderTesting.getStackedArgs('command');
    const optionStackedArgs = commanderTesting.getStackedArgs('option');
    const buildCommand = commanderTesting.getArgInStack('action', 1, 1);
    const docsCommand = commanderTesting.getArgInStack('action', 2, 1);
    const helpCommand = commanderTesting.getArgInStack('action', 3, 1);
    const anyCommand = commanderTesting.getArgInStack('action', 4, 1);
    // commander data
    expect(versionArgs).eql([
      '2.0.0-beta', '-v, --version'
    ]);
    expect(usageArgs).eql([
      'sheetbase-app-scripts [options] [command]'
    ]);
    expect(descriptionStackedArgs).eql([
      ['Scripts for Sheetbase backend modules and apps.'],
      ['Build distribution package.'],
      ['Generate the documentation.'],
      ['Display help.'],
      ['Any other command is not supported.'],
    ]);
    expect(commandStackedArgs).eql([
      ['build'], ['docs'], ['help'], ['*']
    ]);
    expect(optionStackedArgs).eql([
      // build command
      ['--copy [value]', 'Copied resources, comma-seperated.'],
      ['--vendor [value]', 'Files for @vendor.js, comma-seperated.'],
    ]);
    // build command result
    const buildCommandResult = await buildCommand('xxx');
    expect(buildCommandResult).eql(
      { build: 'xxx' }
    );
    // docs command result
    const docsCommandResult = await docsCommand();
    expect(docsCommandResult).eql(
      { docs: true }
    );
    // help command result
    const helpCommandResult = await helpCommand();
    expect(helpCommandResult).equal(
      '#outputHelp'
    );
    // * command result
    const errorStub = sinon.stub(console, 'error').callsFake(value => value);
    const anyCommandResult = await anyCommand('xxx');
    expect(anyCommandResult).equal(
      `\u001b[31mUnknown command \'xxx\'\u001b[39m`
    );
    errorStub.restore();
  });
});
