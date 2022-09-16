import * as fs from "fs";

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

export const context = {
  project,
  repository,
  branch: getBranch(),
  workingDir: process.env.GITHUB_WORKSPACE,
  eventName: process.env.GITHUB_EVENT_NAME,
};
