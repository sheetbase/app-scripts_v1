// tslint:disable: no-any
import { expect } from 'chai';
import * as sinon from 'sinon';
import { rewireModule } from './index.spec';

class MockedCommander {
  // version
  versionArgs: string[] = [];
  version(...args: string[]) {
    this.versionArgs = args;
    return this;
  }
  // usage
  usageText = '';
  usage(value: string) {
    this.usageText = value;
    return this;
  }
  // description
  descriptionList: string[] = [];
  description(value: string) {
    this.descriptionList.push(value);
    return this;
  }
  // command
  commandList: string[] = [];
  command(value: string) {
    this.commandList.push(value);
    return this;
  }
  // option
  optionArgsList: string[][] = [];
  option(...args: string[]) {
    this.optionArgsList.push(args);
    return this;
  }
  // action
  actionList: any[] = [];
  action(value: any) {
    this.actionList.push(value);
    return this;
  }
  // help
  outputHelp() {
    return '#outputHelp';
  }
}

class MockedBuildCommand {
  async build(options: any) {
    return { build: options };
  }
}

class MockedDocsCommand {
  async docs() {
    return { docs: true };
  }
}

async function getData() {
  const moduleRewiring = rewireModule(
    () => import('../src/cli'),
    {
      'commander': new MockedCommander(),
      '../src/services/file': { FileService: class {} },
      '../src/services/message': { MessageService: class {} },
      '../src/services/typedoc': { TypedocService: class {} },
      '../src/services/project': { ProjectService: class {} },
      '../src/services/rollup': { RollupService: class {} },
      '../src/services/content': { ContentService: class {} },
      '../src/commands/build': { BuildCommand: MockedBuildCommand },
      '../src/commands/docs': { DocsCommand: MockedDocsCommand },
    }
  );
  const rewiredModule = await moduleRewiring.getModule();
  const cliApp = new rewiredModule.CLIApp();
  return {
    moduleRewiring,
    rewiredModule,
    cliApp,
  };
}

describe('cli.ts', () => {

  it('#cli', async () => {
    const { cliApp } = await getData();

    const result = cliApp.getApp();
    // commander data
    expect(result.versionArgs).eql(['2.0.0-beta', '-v, --version']);
    expect(result.usageText).equal('sheetbase-app-scripts [options] [command]');
    expect(result.descriptionList).eql([
      'Scripts for Sheetbase backend modules and apps.',
      'Build distribution package.',
      'Generate the documentation.',
      'Display help.',
      'Any other command is not supported.',
    ]);
    expect(result.commandList).eql(['build', 'docs', 'help', '*']);
    expect(result.optionArgsList).eql([
      // build
      ['--copy [value]', 'Copied resources, comma-seperated.'],
      ['--vendor [value]', 'Files for @vendor.js, comma-seperated.'],
    ]);
    // build command result
    expect(await result.actionList[0]('xxx')).eql({
      build: 'xxx',
    });
    // docs command result
    expect(await result.actionList[1]()).eql({
      docs: true,
    });
    // help command result
    expect(await result.actionList[2]()).equal('#outputHelp');
    // * command result
    const errorStub = sinon.stub(console, 'error').callsFake(value => value);
    expect(await result.actionList[3]('xxx')).equal(
      `\u001b[31mUnknown command \'xxx\'\u001b[39m`
    );
    errorStub.restore();
  });
});
