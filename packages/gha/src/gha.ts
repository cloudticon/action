import * as fs from "fs";
import { TerraformCmd } from "../../core/src/terraform/Terraform";
import * as core from "@actions/core";
import { Logger, RepositoryContext } from "../../core/src/context/types";

type GithubEvent = {
  sender: {
    avatar_url: string;
    login: string;
    url: string;
  };
  head_commit?: {
    message: string;
  };
};
const event: GithubEvent = JSON.parse(
  fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")
);
console.log(event);
export const getGithubEvent = () => {
  return event;
};
const getBranch = () => {
  if (process.env.GITHUB_EVENT_NAME === "delete") {
    const event = JSON.parse(
      fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")
    );
    return event.ref;
  }
  const [, , branch] = process.env.GITHUB_REF.split("/");
  return branch;
};

const [project, repository] = process.env.GITHUB_REPOSITORY.split("/");

const getCmd = (): TerraformCmd => {
  if (context.eventName === "delete") {
    return "destroy";
  }
  const cmd = core.getInput("cmd") as TerraformCmd;
  if (cmd) {
    return cmd;
  }
  return "apply";
};

const ghaLogger: Logger = {
  info: core.info,
  debug: core.debug,
};

export const context: RepositoryContext = {
  project: project.toLowerCase(),
  repository: repository.toLowerCase(),
  branch: getBranch(),
  workingDir: process.env.GITHUB_WORKSPACE,
  eventName: process.env.GITHUB_EVENT_NAME,
  cmd: getCmd(),
  ctToken: core.getInput("apiKey"),
  logger: ghaLogger,
};
