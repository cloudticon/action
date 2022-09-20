import axios from "axios";
import * as core from "@actions/core";
import { context } from "./context";

export type CtCreds = {
  kubeconfig: string;
  awsAccessKey: string;
  awsSecretKey: string;
  baseDomain: string;
  baseIp: string;
  docker: {
    url: string;
    user: string;
    password: string;
  };
  sentry?: {
    url: string;
    token: string;
    organization: string;
    team: string;
  };
  discord?: {
    webhook: string;
  };
  cloudflare?: {
    token: string;
  };
};

export const ctClient = axios.create({
  baseURL: "https://auth.dev2.cloudticon.com",
  headers: {
    "x-api-key": core.getInput("apiKey"),
  },
});

export const fetchCreds = (): Promise<CtCreds> => {
  return ctClient.get("/creds").then((res) => res.data);
};

export const fetchValues = (): Promise<Record<string, string>> => {
  return ctClient
    .get(
      `/project/${context.project}/repository/${context.repository}/branch/${context.branch}/values`
    )
    .then((res) => res.data);
};
