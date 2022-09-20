import { getRepositoryOutput } from "../legacy/getRepositoryOutput";

type HasuraOutput = {
  hasuraGraphqlUrl: string;
  hasuraAdminSecret: string;
  url: string;
};

export const getBackendOutput = (repository: string = "backend") => {
  const output = getRepositoryOutput<HasuraOutput>({
    repository,
  });
  return {
    gqlUrl: output.get("hasuraGraphqlUrl"),
    url: output.get("url"),
    adminSecret: output.get("hasuraAdminSecret"),
  };
};
