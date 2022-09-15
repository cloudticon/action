import { heredoc, map } from "terraform-generator";
import { getNamespace } from "./tfg";
import { getDockerCreds } from "./utils/setupCreds";
import { context } from "./context";
import { Terraform, TerraformCmd } from "./Terraform";

export const createProjectBranchTf = (cmd: TerraformCmd) => {
  const dir = `${context.workingDir}/.ct/project-branch`;
  const dockerCreds = getDockerCreds();

  const tf = new Terraform(dir, {
    required_version: ">= 0.12",
    required_providers: {
      kubernetes: map({
        source: "hashicorp/kubernetes",
        version: "2.13.1",
      }),
    },
  });

  const namespace = tf.resource("kubernetes_namespace_v1", "default", {
    metadata: {
      name: `${context.project}-${context.branch}`,
    },
  });

  tf.resource("kubernetes_secret", "ct-registry", {
    metadata: {
      name: "ct-registry",
      namespace: namespace.attr("metadata[0].name"),
    },
    data: map({
      '".dockerconfigjson"': heredoc(
        JSON.stringify({
          auths: {
            [dockerCreds.url]: {
              username: dockerCreds.user,
              password: dockerCreds.password,
              auth: "YWRtaW46N1BpOTE1cjN3ODZmMHY0Mg==",
            },
          },
        })
      ),
    }),
    type: "kubernetes.io/dockerconfigjson",
  });

  return tf.cmd(cmd);
};
