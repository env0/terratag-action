import core from '@actions/core';

import terratagAction from './lib/terratag-action';

(async () => {
  try {
    await terratagAction();
  } catch (error) {
    core.info('blablabla');
    console.error(`Action JS error: ${error}`);
    core.setFailed(error.message);
  }
})();
