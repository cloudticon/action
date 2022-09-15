import { tfg } from "../tfg";
import { context } from "../context";
import { map } from "terraform-generator";

type GetRepositoryOutputParams = {
  repository: string;
  project?: string;
  branch?: string;
  rejectNotExist?: boolean;
};
export const getRepositoryOutput = ({
  repository,
  project = context.project,
  branch = context.branch,
}: GetRepositoryOutputParams) => {
  const data = tfg.data("terraform_remote_state", `${repository}-${branch}`, {
    backend: "s3",
    config: map({
      bucket: "cloudticon",
      key: `waw/${project}-${repository}/${branch}`,
      region: "eu-central-1",
    }),
  });
  return {
    get: (name: string) => data.attr("outputs").attr(name),
  };
};
