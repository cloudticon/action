import { getRepositoryOutput } from "./legacy/getRepositoryOutput";

type TOutput = ReturnType<typeof getRepositoryOutput>;
type HasuraOutput = {
  hasuraGraphqlUrl: string;
  hasuraAdminSecret: string;
  url: string;
};

class ToolOutput {
  private output?: TOutput;

  constructor(private project: string) {}

  get url() {
    return this.getValue("url");
  }

  get gqlUrl() {
    return this.getValue("hasuraGraphqlUrl");
  }

  get adminSecret() {
    return this.getValue("hasuraAdminSecret");
  }

  private getValue(name: string) {
    if (!this.output) {
      this.output = getRepositoryOutput<HasuraOutput>({
        project: this.project,
        repository: "backend",
        branch: "master",
      });
    }
    // @ts-ignore
    return this.output.get(name);
  }
}

export const tools = {
  pay: new ToolOutput("payticon-pay"),
  info: new ToolOutput("infoticon"),
  auth: new ToolOutput("authticon"),
};
