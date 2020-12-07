// Node.js core
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const axios = require('axios');
const {exec} = require('child_process');

// External
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const io = require('@actions/io');

// arch in [arm, x32, x64...] (https://nodejs.org/api/os.html#os_os_arch)
// return value in [amd64, 386, arm]
function mapArch (arch) {
  const mappings = {
    x32: '386',
    x64: 'amd64'
  };
  return mappings[arch] || arch;
}

// os in [darwin, linux, win32...] (https://nodejs.org/api/os.html#os_os_platform)
// return value in [darwin, linux, windows]
function mapOS (os) {
  const mappings = {
    win32: 'windows'
  };
  return mappings[os] || os;
}

async function downloadCLI (url) {
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

async function latestVersion () {
  const response = await axios.get('https://github.com/env0/terratag/releases');
  if (response.status !== 200) {
    throw new Error(`Unable to fetch terratag releases`);
  }
  const regex = new RegExp('href="/env0/terratag/releases/tag/v(.{1,15})"');
  const found = response.data.match(regex);
  if (!found) {
    throw new Error("Unable to determine latest terratag version");
  }
  return found[1];
}

async function run () {
  try {
    // Gather GitHub Actions inputs
    let version = core.getInput('terratag_version');
    const cliArgs = core.getInput('cli_args');

    // Gather OS details
    const osPlatform = os.platform();
    const osArch = os.arch();
    if (osArch !== 'x64') {
        throw new Error("Terratag action currently only supports x64/amd64");
    }

    if (version === "latest") {
      version = await latestVersion();
    }
    const platform = mapOS(osPlatform);
    const arch = mapArch(osArch);
    console.info(`Getting build for terratag version ${version}: ${platform} ${arch}`);
    core.debug(`Getting build for terratag version ${version}: ${platform} ${arch}`);
    // Download requested version
    const url = `https://github.com/env0/terratag/releases/download/v${version}/terratag_${version}_${platform}_${arch}.tar.gz`;
    console.info(`Download url: ${url}`);
    const pathToCLI = await downloadCLI(url);
    core.info(`Successfully installed terratag ${version}`);
    // Add to path
    core.addPath(pathToCLI);
    console.info("Terratag installed, invoking");

    await new Promise((resolve, reject)=>{
      exec(`${pathToCLI}/terratag ${cliArgs}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        }
        if (stderr) {
          console.error(stderr);
          core.error(stderr);
        }
        console.info(stdout);
        core.info(stdout);
        resolve();
      });
    });
  } catch (error) {
    core.error(error);
    throw error;
  }
}

module.exports = run;
