import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import * as fs from "fs";

export const setupBuildx = async () => {
  core.info("Download docker buildx");
  const url =
    "https://github.com/docker/buildx/releases/download/v0.9.1/buildx-v0.9.1.linux-amd64";
  const binaryPath = await tc.downloadTool(url, "/tmp/docker-buildx/buildx");
  core.addPath("/tmp/docker-buildx");
  fs.chmodSync(binaryPath, "777");
};
