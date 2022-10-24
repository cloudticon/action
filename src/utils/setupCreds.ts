import * as core from "@actions/core";
import * as fs from "fs";
import { exec } from "@actions/exec";
import { CtCreds, fetchCreds } from "../ctClient";

let creds: CtCreds;

export const getCtCreds = () => {
  if (!creds) {
    throw new Error("setup creds before use getDockerCreds");
  }
  return creds;
};

export const getDockerCreds = () => {
  return getCtCreds().docker;
};

export const setupCreds = async () => {
  creds = await fetchCreds();
  process.env.KUBECONFIG = "/tmp/kubeconfig";
  fs.writeFileSync(`/tmp/kubeconfig`, creds.kubeconfig);
  core.exportVariable("KUBE_CONFIG_PATH", "/tmp/kubeconfig");
  core.exportVariable("AWS_ACCESS_KEY_ID", creds.awsAccessKey);
  core.exportVariable("AWS_SECRET_ACCESS_KEY", creds.awsSecretKey);

  const { url, user, password } = creds.docker;
  await exec(`docker login ${url} --username ${user} --password ${password}`);
};
