import * as core from "@actions/core";
import axios from "axios";
import * as fs from "fs";
import { exec } from "@actions/exec";

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

  fs.writeFileSync(
    `/tmp/kubeconfig`,
    Buffer.from(response.data.kubeconfig, "base64")
  );
  core.exportVariable("KUBE_CONFIG_PATH", "/tmp/kubeconfig");
  core.exportVariable("AWS_ACCESS_KEY_ID", response.data.awsAccessKey);
  core.exportVariable("AWS_SECRET_ACCESS_KEY", response.data.awsSecretKey);

  const { url, user, password } = response.data.docker;
  await exec(`docker login ${url} --username ${user} --password ${password}`);
};
