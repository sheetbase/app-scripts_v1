import * as os from 'os';
import { resolve } from 'path';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { spawnSync } from 'child_process';

const SHEETBASE = (os.type() === 'Windows_NT') ? 'sheetbase-app-scripts.cmd' : 'sheetbase-app-scripts';

const APP_PATH = resolve('./tests/resources/app');
const MODULE_PATH = resolve('./tests/resources/module');

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

describe('Test --help for each command', () => {
    it('should build --help', () => {
      expectResult(['build', '--help'], 'Build module or app for GAS deployment.');
    });
    it('should deploy --help', () => {
      expectResult(['deploy', '--help'], 'Deploy code to GAS using @google/clasp.');
    });
    it('should readme --help', () => {
      expectResult(['readme', '--help'], 'Generate README.md.');
    });
    it('should help --help', () => {
      expectResult(['help', '--help'], 'Display help.');
    });
  });

  describe('Test DEPLOY command', () => {
    it.skip('should deploy using @google/clasp');
  });

  describe('Test README command', () => {
    it.skip('should generate readme');
  });

  describe('Test BUILD command', () => {
    it.skip('should build module');
  });

  describe('Test variations of help', () => {
    const EXPECTED = `sheetbase-app-scripts [options] [command]`;
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