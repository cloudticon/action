import { Kubernetes, PlatformKubernetes } from "./kubernetes/Kubernetes";
import { CertManager } from "./CertManager";
import { DockerRegistry } from "./DockerRegistry";
import { HaProxyIngress } from "./HaProxyIngress";

export type ClusterInput = {
  platform: "gcp";
  name: string;
};

export class Cluster {
  public kubernetes: Kubernetes;
  public certManager: CertManager;
  public dockerRegistry: DockerRegistry;
  public ingressController: HaProxyIngress;

  constructor({ name, platform }: ClusterInput) {
    this.kubernetes = new Kubernetes({
      platform,
      name,
    });

    this.kubernetes.nodePool({
      name: "init",
      count: 1,
    });

    this.certManager = new CertManager({ name: "cert-manager" });
    this.ingressController = new HaProxyIngress({ name: "haproxy" });
    this.dockerRegistry = new DockerRegistry({
      name: "docker-registry",
      host: `registry.${name}.cloudticon.com`,
      ingressClassName: "haproxy",
      certManagerClusterIssuer: "cloudticon-production",
    });
  }
}
