import { GcpKubernetes } from "./gcp/GcpKubernetes";
import { Input } from "../../../../lib/types";

export type KubernetesInput = {
  name: string;
};
export type KubernetesNodePoolInput = {
  name: string;
  kubernetes: PlatformKubernetes;
  count: Input<number>;
  nodeType?: Input<string>;
};

export type PlatformKubernetes = {
  nodePool(input: KubernetesNodePoolInput): PlatformKubernetesNodePool;
};

export type PlatformKubernetesNodePool = {};

export class Kubernetes {
  public platformKubernetes: PlatformKubernetes;

  constructor({ platform, ...input }: KubernetesInput & { platform: "gcp" }) {
    switch (platform) {
      case "gcp":
        this.platformKubernetes = new GcpKubernetes(input);
      default:
        throw new Error(`Unsupported platform ${platform}`);
    }
  }

  nodePool(input: Omit<KubernetesNodePoolInput, "kubernetes">) {
    return this.platformKubernetes.nodePool({ ...input, kubernetes: this });
  }
}
