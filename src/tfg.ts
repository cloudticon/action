import { TerraformGenerator, map, heredoc, Backend } from "terraform-generator";
import { Service } from "./Service";
import { context } from "./context";

const services: Service[] = [];
export const registerService = (service: Service) => {
  services.push(service);
};

export const generateServices = () => {
  for (let service of services) {
    service.toTf();
  }
  tfg.write({ dir: context.workingDir, format: true });
};
export const tfg = new TerraformGenerator({
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
});

tfg.backend("s3", {
  bucket: "cloudticon",
  key: `waw/${context.repository}/${context.branch}`,
  region: "eu-central-1",
});

tfg.provider("docker", {});

tfg.provider("null", {});

tfg.provider("kubernetes", {
  config_path: "~/.kube/ct-waw",
});

export const namespace = tfg.resource("kubernetes_namespace_v1", "default", {
  metadata: {
    name: `${context.repository}-${context.branch}`,
  },
});

export const getNamespace = () => {
  return namespace.attr("metadata[0].name");
};

tfg.resource("kubernetes_secret", "ct-registry", {
  metadata: {
    name: "ct-registry",
    namespace: getNamespace(),
  },
  data: map({
    '".dockerconfigjson"': heredoc(
      JSON.stringify({
        auths: {
          "https://registry.cloudticon.com": {
            username: "admin",
            password: "7Pi915r3w86f0v42",
            auth: "YWRtaW46N1BpOTE1cjN3ODZmMHY0Mg==",
          },
        },
      })
    ),
  }),
  type: "kubernetes.io/dockerconfigjson",
});
