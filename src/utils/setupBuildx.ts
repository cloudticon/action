import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import * as fs from "fs";

export const setupHasuraCli = async () => {
  core.debug("Download hasura cli");
  const url = "";
  const binaryPath = await tc.downloadTool(url, "/tmp/hasura-cli/hasura");
  core.addPath("/tmp/hasura-cli");

  fs.chmodSync(binaryPath, "777");
};
