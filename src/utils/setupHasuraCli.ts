import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import * as fs from "fs";

export const setupHasuraCli = async () => {
  core.info("Download hasura cli");
  const url =
    "https://github.com/hasura/graphql-engine/releases/download/v2.11.2/cli-hasura-linux-amd64";
  const binaryPath = await tc.downloadTool(url, "/tmp/hasura-cli/hasura");
  core.addPath("/tmp/hasura-cli");

  fs.chmodSync(binaryPath, "777");
};
