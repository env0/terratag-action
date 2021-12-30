import os from 'os';
import axios from 'axios';
import childProcess from 'child_process';
import * as core from '@actions/core';
import tc from '@actions/tool-cache';

// arch in [arm, x32, x64...] (https://nodejs.org/api/os.html#os_os_arch)
// return value in [amd64, 386, arm]
function mapArch(arch: string): string {
  const mappings: { [key: string]: string } = {
    x32: '386',
    x64: 'amd64'
  };
  return mappings[arch] || arch;
}

// os in [darwin, linux, win32...] (https://nodejs.org/api/os.html#os_os_platform)
// return value in [darwin, linux, windows]
function mapOS(os: string): string {
  const mappings: { [key: string]: string } = {
    win32: 'windows'
  };
  return mappings[os] || os;
}

async function downloadCLI(url: string): Promise<string> {
  core.debug(`Downloading Terratag CLI from ${url}`);
  const pathToCLITar = await tc.downloadTool(url);

  core.debug('Extracting Terratag CLI zip file');
  const pathToCLI = await tc.extractTar(pathToCLITar);
  core.debug(`Terratag CLI path is ${pathToCLI}.`);

  if (!pathToCLITar || !pathToCLI) {
    throw new Error(`Unable to download Terratag from ${url}`);
  }

  return pathToCLI;
}

async function latestVersion(): Promise<string> {
  const response = await axios.get('https://github.com/env0/terratag/releases');
  if (response.status !== 200) {
    throw new Error(`Unable to fetch terratag releases: response ${response.status}: ${response.data}`);
  }
  const regex = new RegExp('href="/env0/terratag/releases/tag/v(.{1,15})"');
  const found = response.data.match(regex);
  if (!found) {
    throw new Error('Unable to determine latest terratag version');
  }
  return found[1];
}

function cliArgsFromActionInputs(): string[] {
  const cliArgs = [`-tags=${core.getInput('tags')}`];
  const dir = core.getInput('dir');
  if (dir) {
    cliArgs.push(`-dir=${dir}`);
  }
  const boolFlag = (flagName: string) => {
    const value = core.getInput(flagName);
    if (value) {
      if (value !== 'true' && value !== 'false') {
        throw new Error(`${flagName} can only accept 'true' or 'false'`);
      }
      cliArgs.push(`-${flagName}=${value}`);
    }
  };
  boolFlag('skipTerratagFiles');
  boolFlag('verbose');
  boolFlag('rename');
  return cliArgs;
}

async function terratagVersionFromActionInputs(): Promise<string> {
  const version = core.getInput('terratagVersion');
  if (version === 'latest') {
    return await latestVersion();
  }
  return version;
}

function terratagVersionDownloadURL(version: string): string {
  const osPlatform = os.platform();
  const osArch = os.arch();
  if (osArch !== 'x64') {
    throw new Error('Terratag action currently only supports x64/amd64');
  }

  const platform = mapOS(osPlatform);
  const arch = mapArch(osArch);
  console.info(`Getting build for terratag version ${version}: ${platform} ${arch}`);
  core.debug(`Getting build for terratag version ${version}: ${platform} ${arch}`);
  // Download requested version
  const url = `https://github.com/env0/terratag/releases/download/v${version}/terratag_${version}_${platform}_${arch}.tar.gz`;
  return url;
}

export default async function run(): Promise<void> {
  try {
    // Gather GitHub Actions inputs
    const cliArgs = cliArgsFromActionInputs();
    const version = await terratagVersionFromActionInputs();
    const downloadURL = terratagVersionDownloadURL(version);
    console.info(`Download url: ${downloadURL}`);
    const pathToCLI = await downloadCLI(downloadURL);
    core.info(`Successfully installed terratag ${version}`);
    // Add to path
    core.addPath(pathToCLI);
    console.info('Terratag installed, invoking');

    await new Promise<void>((resolve, reject) => {
      const child = childProcess.spawn(`${pathToCLI}/terratag`, cliArgs);
      child.stdout.on('data', data => {
        console.info(data);
        core.info(data);
      });
      child.stderr.on('data', data => {
        console.error(data);
        core.error(data);
      });
      child.on('close', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Terratag cli exited with code ${code}`));
        }
      });
    });
  } catch (error) {
    core.error((error as Error).toString());
    throw error;
  }
}
