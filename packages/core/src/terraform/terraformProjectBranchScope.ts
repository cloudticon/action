import { heredoc, map } from "terraform-generator";
import { getDockerCreds } from "../utils/setupCreds";
import { context } from "../context";
import { Terraform } from "./Terraform";
import { getNamespace } from "../utils/getNamespace";
import { resource } from "../tfResource";

export const terraformProjectBranchScope = () => {
  const dir = `${context.ctDir}/project-branch`;
  const dockerCreds = getDockerCreds();

  const tf = new Terraform(`${context.project}-${context.branch}`, dir, {
    required_version: ">= 0.12",
    required_providers: {
      kubernetes: map({
        source: "hashicorp/kubernetes",
        version: "2.13.1",
      }),
    },
  });

  tf.provider("kubernetes", {});

  const namespace = resource(tf, "kubernetes_namespace_v1", "default", {
    metadata: {
      name: getNamespace(),
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

  return tf;
};
