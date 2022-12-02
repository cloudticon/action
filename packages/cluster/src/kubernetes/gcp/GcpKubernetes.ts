import { globalTerraform } from "../../../../../lib/utils/compileAndRequireCtFile";
import { Resource } from "terraform-generator";
import { KubernetesNodePoolInput, PlatformKubernetes } from "../Kubernetes";
import { GcpKubernetesNodePool } from "./GcpKubernetesNodePool";

export type GcpKubernetesInput = {
  name: string;
};
export class GcpKubernetes implements PlatformKubernetes {
  public cluster: Resource;
  constructor({ name }: GcpKubernetesInput) {
    globalTerraform.provider("google");
    this.cluster = globalTerraform.resource("google_container_cluster", name, {
      remove_default_node_pool: true,
      initial_node_count: 1,
    });
  }

  nodePool(input: KubernetesNodePoolInput) {
    return new GcpKubernetesNodePool(input);
  }
}
