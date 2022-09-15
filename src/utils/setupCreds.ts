import * as core from "@actions/core";
import axios from "axios";
import * as fs from "fs";
import { exec } from "@actions/exec";

type DockerCreds = {
  url: string;
  user: string;
  password: string;
};
let creds: {
  kubeconfig: string;
  awsAccessKey: string;
  awsSecretKey: string;
  docker: DockerCreds;
};

export const getDockerCreds = () => {
  if (!creds) {
    throw new Error("setup creds before use getDockerCreds");
  }
  return creds.docker;
};

export const setupCreds = async () => {
  const apikey = core.getInput("apiKey");
  const response = await axios.post(
    "https://auth.dev2.cloudticon.com/creds",
    {},
    {
      headers: {
        "x-api-key": apikey,
      },
    }
  );

  creds = response.data;
  fs.writeFileSync(`/tmp/kubeconfig`, Buffer.from(creds.kubeconfig, "base64"));
  core.exportVariable("KUBE_CONFIG_PATH", "/tmp/kubeconfig");
  core.exportVariable("AWS_ACCESS_KEY_ID", creds.awsAccessKey);
  core.exportVariable("AWS_SECRET_ACCESS_KEY", creds.awsSecretKey);

  const { url, user, password } = creds.docker;
  await exec(`docker login ${url} --username ${user} --password ${password}`);
};
