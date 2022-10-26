export type Logger = {
  info: (log: string) => void;
  debug: (log: string) => void;
};

export type RepositoryContext = {
  project: string;
  repository: string;
  branch: string;
  workingDir: string;
  eventName: string;
  cmd: string;
  ctToken: string;
  logger: Logger;
};
