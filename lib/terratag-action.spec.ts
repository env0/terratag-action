jest.mock('axios');
jest.mock('child_process');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;
import childProcess from 'child_process';
const mockedChildProcess = childProcess as jest.Mocked<typeof childProcess>;
import core from '@actions/core';
const mockedCore = core as jest.Mocked<typeof core>;
import tc from '@actions/tool-cache';
const mockedTC = tc as jest.Mocked<typeof tc>;

import run from './terratag-action';

test('simple end to end, latest terratag', async () => {
  jest.resetAllMocks();
  mockedCore.getInput.mockImplementation((name: string) => {
    const inputs: { [key: string]: string } = { terratagVersion: 'latest', tags: JSON.stringify({ a: 'b' }) };
    return inputs[name];
  });
  mockedAxios.get.mockResolvedValue({
    status: 200,
    data: `href="/env0/terratag/releases/tag/v1.2.3"`
  });
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
  await run();
  expect(mockedCore.addPath.mock.calls).toEqual([['FAKE PATH FOR EXTRACTED']]);
  expect(mockedAxios.get.mock.calls).toEqual([['https://github.com/env0/terratag/releases']]);
  expect(mockedTC.downloadTool.mock.calls).toEqual([
    ['https://github.com/env0/terratag/releases/download/v1.2.3/terratag_1.2.3_linux_amd64.tar.gz']
  ]);
  expect(mockedTC.extractTar.mock.calls).toEqual([['FAKE PATH FOR DOWNLOADED TOOL TAR']]);
  expect(mockedChildProcess.spawn.mock.calls).toEqual([['FAKE PATH FOR EXTRACTED/terratag', ['-tags={"a":"b"}']]]);
});

test('simple end to end, specific terratag', async () => {
  jest.resetAllMocks();
  mockedCore.getInput.mockImplementation((name: string) => {
    const inputs: { [key: string]: string } = { terratagVersion: '5.6.7', tags: JSON.stringify({ a: 'b' }) };
    return inputs[name];
  });
  mockedAxios.get.mockRejectedValue('Should not be called');
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
  await run();
  expect(mockedCore.addPath.mock.calls).toEqual([['FAKE PATH FOR EXTRACTED']]);
  expect(mockedAxios.get.mock.calls).toEqual([]);
  expect(mockedTC.downloadTool.mock.calls).toEqual([
    ['https://github.com/env0/terratag/releases/download/v5.6.7/terratag_5.6.7_linux_amd64.tar.gz']
  ]);
  expect(mockedTC.extractTar.mock.calls).toEqual([['FAKE PATH FOR DOWNLOADED TOOL TAR']]);
  expect(mockedChildProcess.spawn.mock.calls).toEqual([['FAKE PATH FOR EXTRACTED/terratag', ['-tags={"a":"b"}']]]);
});
