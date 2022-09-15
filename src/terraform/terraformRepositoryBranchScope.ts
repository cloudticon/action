import { Terraform } from "./Terraform";
import { map } from "terraform-generator";
import { context } from "../context";

export const terraformRepositoryBranchScope = () => {
  const dir = `/tmp/.ct/repository-branch`;
  const tf = new Terraform(
    `${context.project}-${context.repository}-${context.branch}`,
    dir,
    {
      required_version: ">= 0.12",
      required_providers: {
        docker: map({
          source: "kreuzwerker/docker",
          version: "2.21.0",
        }),
        kubernetes: map({
          source: "hashicorp/kubernetes",
          version: "2.13.1",
        }),
        null: map({
          source: "hashicorp/null",
          version: "3.1.1",
        }),
        random: map({
          source: "hashicorp/random",
          version: "3.4.3",
        }),
      },
    }
  );

  tf.provider("docker", {});

  tf.provider("null", {});

  tf.provider("kubernetes", {});

  return tf;
};
