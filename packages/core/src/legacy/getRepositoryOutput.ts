import { context } from "../context";
import { map } from "terraform-generator";
import { globalTerraform } from "../utils/compileAndRequireCtFile";
import { Argument } from "terraform-generator/dist/arguments";
type Output<T> = {
  get<K extends keyof T>(key: K): Argument;
};

export type GetRepositoryOutputParams = {
  repository: string;
  project?: string;
  branch?: string;
  rejectNotExist?: boolean;
};
export const getRepositoryOutput = <T>({
  repository,
  project = context.project,
  branch = context.branch,
}: GetRepositoryOutputParams): Output<T> => {
  const data = globalTerraform.data(
    "terraform_remote_state",
    `${project}-${repository}-${branch}`,
    {
      backend: "s3",
      config: map({
        bucket: "cloudticon",
        key: `waw/${project}-${repository}-${branch}`,
        region: "eu-central-1",
      }),
    }
  );
  return {
    get: (name: any) => data.attr("outputs").attr(name),
  };
};
