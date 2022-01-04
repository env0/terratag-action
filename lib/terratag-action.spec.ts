import os from 'os';
import axios from 'axios';
import childProcess from 'child_process';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import { exportedForTesting } from './terratag-action';

jest.mock('axios');
jest.mock('child_process');
jest.mock('@actions/core');
jest.mock('@actions/tool-cache');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedChildProcess = childProcess as jest.Mocked<typeof childProcess>;
const mockedCore = core as jest.Mocked<typeof core>;
const mockedTC = tc as jest.Mocked<typeof tc>;

const { mapOS, mapArch } = exportedForTesting;

import run from './terratag-action';

describe('terratag action', () => {
  const osPlatform = os.platform();
  const osArchitecture = os.arch();

  beforeEach(() => {
    mockedTC.downloadTool.mockResolvedValue('FAKE PATH FOR DOWNLOADED TOOL TAR');
    mockedTC.extractTar.mockResolvedValue('FAKE PATH FOR EXTRACTED');
    const spawn = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn()
    };
    spawn.on.mockImplementation((eventName: string, callback: (code: number) => void) => {
      expect(eventName).toBe('close');
      callback(0);
    });
    mockedChildProcess.spawn.mockReturnValue(spawn as any);
  });

  describe('simple end to end, latest terratag', () => {
    beforeEach(async () => {
      mockedCore.getInput.mockImplementation((name: string) => {
        const inputs: { [key: string]: string } = { terratagVersion: 'latest', tags: JSON.stringify({ a: 'b' }) };
        return inputs[name];
      });
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: `href="/env0/terratag/releases/tag/v1.2.3"`
      });
      await run();
    });
    it('shoud query which version of terratag is latest', () => {
      expect(mockedAxios.get.mock.calls).toEqual([['https://github.com/env0/terratag/releases']]);
    });
    it('should download terratag from expected url', () => {
      expect(mockedTC.downloadTool.mock.calls).toEqual([
        [
          `https://github.com/env0/terratag/releases/download/v1.2.3/terratag_1.2.3_${mapOS(osPlatform)}_${mapArch(
            osArchitecture
          )}.tar.gz`
        ]
      ]);
    });
    it('should extract downloaded terratag', () => {
      expect(mockedCore.addPath.mock.calls).toEqual([['FAKE PATH FOR EXTRACTED']]);
    });
    it('should extract downloaded terratag', () => {
      expect(mockedTC.extractTar.mock.calls).toEqual([['FAKE PATH FOR DOWNLOADED TOOL TAR']]);
    });
    it('should execute terratag with the correct cli arguments', () => {
      expect(mockedChildProcess.spawn.mock.calls).toEqual([['FAKE PATH FOR EXTRACTED/terratag', ['-tags={"a":"b"}']]]);
    });
  });

  describe('simple end to end, specific terratag', () => {
    beforeEach(async () => {
      mockedCore.getInput.mockImplementation((name: string) => {
        const inputs: { [key: string]: string } = { terratagVersion: '5.6.7', tags: JSON.stringify({ a: 'b' }) };
        return inputs[name];
      });
      mockedAxios.get.mockRejectedValue('Should not be called');
      await run();
    });
    it('shoud NOT query which terratag versions', () => {
      expect(mockedAxios.get.mock.calls).toEqual([]);
    });
    it('should download terratag from expected url', () => {
      expect(mockedTC.downloadTool.mock.calls).toEqual([
        [
          `https://github.com/env0/terratag/releases/download/v5.6.7/terratag_5.6.7_${mapOS(osPlatform)}_${mapArch(
            osArchitecture
          )}.tar.gz`
        ]
      ]);
    });
    it('should extract downloaded terratag', () => {
      expect(mockedCore.addPath.mock.calls).toEqual([['FAKE PATH FOR EXTRACTED']]);
    });
    it('should extract downloaded terratag', () => {
      expect(mockedTC.extractTar.mock.calls).toEqual([['FAKE PATH FOR DOWNLOADED TOOL TAR']]);
    });
    it('should execute terratag with the correct cli arguments', () => {
      expect(mockedChildProcess.spawn.mock.calls).toEqual([['FAKE PATH FOR EXTRACTED/terratag', ['-tags={"a":"b"}']]]);
    });
  });
});
