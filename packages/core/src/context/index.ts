import { Logger, RepositoryContext } from "./types";

const localLogger: Logger = {
  info: console.log,
  debug: () => {},
};

export const context: RepositoryContext = {
  branch: "development",
  cmd: "plan",
  ctToken: "34e2b11b-8d43-4cd0-a9fb-df878f0e5988",
  eventName: "push",
  project: "payticon-pay",
  repository: "backend",
  workingDir: process.cwd(),
  logger: localLogger,
  ctDir: `${process.cwd()}/.ct`,
};
