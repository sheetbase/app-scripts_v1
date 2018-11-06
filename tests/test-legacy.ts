import * as os from 'os';
import { resolve } from 'path';
import { ensureDirSync, removeSync } from 'fs-extra';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { spawnSync } from 'child_process';

const SHEETBASE = (os.type() === 'Windows_NT') ?
  'sheetbase-app-scripts-legacy.cmd' : 'sheetbase-app-scripts-legacy';

const APP_PATH = resolve('./tests/resources-legacy/app');
const MODULE_PATH = resolve('./tests/resources-legacy/module');

function cleanup() {
  removeSync(APP_PATH + '/dist');
  removeSync(MODULE_PATH + '/dist');
  removeSync(MODULE_PATH + '/README.md');
  removeSync(MODULE_PATH + '/sheetbase.module.js');
}

function expectResult(args: string[], expected: string, cwd = '.') {
  const result = spawnSync(
    SHEETBASE, args, { cwd, encoding : 'utf8' },
  );
  expect(result.status).to.equal(0);
  expect(result.stdout).to.contain(expected);
}

function expectError(args: string[], expected: string, cwd = '.') {
  const result = spawnSync(
    SHEETBASE, args, { cwd, encoding : 'utf8' },
  );
  expect(result.stderr).to.contain(expected);
  expect(result.status).to.equal(1);
}

describe('(LEGACY) Test sheetbase-app-scripts-legacy', () => {

  describe('Test --help for each command', () => {
    it('should build --help', () => {
      expectResult(['build', '--help'], 'Build module or app for GAS deployment.');
    });
    it('should push --help', () => {
      expectResult(['push', '--help'], 'Push module or app to GAS using @google/clasp.');
    });
    it('should readme --help', () => {
      expectResult(['readme', '--help'], 'Generate README.md.');
    });
    it('should help --help', () => {
      expectResult(['help', '--help'], 'Display help.');
    });
  });

  describe('Test PUSH command', () => {
    it('should push using @google/clasp', () => expectError(['push'], 'Errors pushing project', MODULE_PATH));
  });

  describe('Test README command', () => {
    afterEach(() => {
      cleanup();
    });

    const EXPECTED = 'README.md ... saved!';

    it('should generate readme', () => expectResult(['readme'], EXPECTED, MODULE_PATH));
    it('should generate readme (custom name)', () => {
      expectResult(['readme', 'test'], EXPECTED, MODULE_PATH);
    });
    it('should generate readme (--no-docs)', () => {
      expectResult(['readme', '--no-docs'], EXPECTED, MODULE_PATH);
    });
  });

  describe('Test BUILD command', () => {
    before(() => {
      ensureDirSync(MODULE_PATH + '/node_modules');
      ensureDirSync(APP_PATH + '/node_modules');
    });

    afterEach(() => {
      cleanup();
    });

    const EXPECTED = 'Build success!';

    it('should build module', () => expectResult(['build'], EXPECTED, MODULE_PATH));
    it('should build module (--param)', () => {
      expectResult(['build', '--param', 'param1'], EXPECTED, MODULE_PATH);
    });
    it('should build module (--vendor)', () => {
      expectResult(['build', '--vendor'], EXPECTED, MODULE_PATH);
    });
    it('should build module (--bundle)', () => {
      expectResult(['build', '--bundle'], EXPECTED, MODULE_PATH);
    });
    it('should build module (--no-init)', () => {
      expectResult(['build', '--no-init'], EXPECTED, MODULE_PATH);
    });
    it('should build app', () => {
      expectResult(['build', '--app'], EXPECTED, APP_PATH);
    });
    it('should build app (--polyfill)', () => {
      expectResult(['build', '--app', '--polyfill'], EXPECTED, APP_PATH);
    });
    it('should build app (--polyfill)', () => {
      expectResult(['build', '--app', '--copy', 'copyme.txt'], EXPECTED, APP_PATH);
    });
  });

  describe('Test variations of help', () => {
    const EXPECTED = `sheetbase-app-scripts-legacy [options] [command]`;
    it('should show help for help', () => expectResult(['help'], EXPECTED));
    it('should show help for --help', () => expectResult(['--help'], EXPECTED));
    it('should show help for -h', () => expectResult(['-h'], EXPECTED));
  });

  describe('Test variations of --version', () => {
    const EXPECTED = require('../package.json').version;
    it('should show version for  --version', () => expectResult(['--version'], EXPECTED));
    it('should show version for  -v', () => expectResult(['-v'], EXPECTED));
  });

  describe('Test unknown commands', () => {
    it('should fail (unknown command)', () => expectError(['unknown'], `Unknown command`));
  });

});