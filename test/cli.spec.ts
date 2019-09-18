// tslint:disable: no-any
import { expect } from 'chai';
import * as sinon from 'sinon';
import { rewiremock } from './index.spec';

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
  async buildCommand(options: any) {
    return { build: options };
  }
}

class MockedDocsCommand {
  async docsCommand(options: any) {
    return { docs: options };
  }
}

const getModule = () =>
  rewiremock.around(
    () => import('../src/cli'),
    mock => {
      // commander
      mock(() => import('commander'))
        .nonStrict()
        .with(new MockedCommander());
      // build
      mock(() => import('../src/commands/build'))
        .nonStrict()
        .with(new MockedBuildCommand());
      // docs
      mock(() => import('../src/commands/docs'))
        .nonStrict()
        .with(new MockedDocsCommand());
    }
  );

function before() {
  rewiremock.enable();
}

function after() {
  rewiremock.disable();
}

describe('CLI app', () => {
  beforeEach(before);
  afterEach(after);

  it('#cli', async () => {
    const CLI = await getModule();
    const result = CLI.cli();
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
    expect(await result.actionList[1]('xxx')).eql({
      docs: 'xxx',
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
