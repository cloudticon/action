import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import * as fs from "fs";
import { exec } from "@actions/exec";

export const setupKubectl = async (version = "v1.18.0") => {
  core.info("Download kubectl");
  const url = `https://storage.googleapis.com/kubernetes-release/release/${version}/bin/linux/amd64/kubectl`;
  const binaryPath = await tc.downloadTool(url, "/tmp/kubectl/kubectl");
  core.addPath("/tmp/kubectl");
  fs.chmodSync(binaryPath, "777");
};
