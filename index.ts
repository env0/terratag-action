import core from "@actions/core";

import terratagAction from "./lib/terratag-action";

(async () => {
  try {
    await terratagAction();
  } catch (error) {
    console.error(`Action JS error: ${error}`);
    core.setFailed(error.message);
  }
})();
