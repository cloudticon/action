import { HelmChart } from "@cloudticon/core";

export type DockerRegistryInput = {
  name: string;
  host: string;
  ingressClassName: string;
  certManagerClusterIssuer: string;
};
export class DockerRegistry extends HelmChart {
  constructor({
    name,
    host,
    ingressClassName,
    certManagerClusterIssuer,
  }: DockerRegistryInput) {
    super({
      name,
      repository: "https://helm.twun.io",
      chart: "registry",
      values: {
        ingress: {
          enabled: true,
          className: ingressClassName,
          hosts: [host],
          annotations: {
            "cert-manager.io/cluster-issuer": certManagerClusterIssuer,
          },
          tls: [
            {
              secretName: host,
              hosts: [host],
            },
          ],
        },
      },
    });
  }
}
