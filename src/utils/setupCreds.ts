import * as core from "@actions/core";
import axios from "axios";
import * as fs from "fs";

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
  fs.mkdirSync("~/.kube");
  fs.writeFileSync(
    `~/.kube/ct-waw`,
    Buffer.from(response.data.kubeconfig, "base64")
  );
  core.exportVariable("AWS_ACCESS_KEY_ID", response.data.awsAccessKey);
  core.exportVariable("AWS_SECRET_ACCESS_KEY", response.data.awsSecretKey);
};
