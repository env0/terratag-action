const core = require('@actions/core');

const terratagAction = require('./lib/terratag-action');

(async () => {
  try {
    await terratagAction();
  } catch (error) {
    console.error(`Action JS error: ${error}`);
    core.setFailed(error.message);
  }
})();
