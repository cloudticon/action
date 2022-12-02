import { globalTerraform } from "../../../../../lib/utils/compileAndRequireCtFile";
import {
  KubernetesNodePoolInput,
  PlatformKubernetesNodePool,
} from "../Kubernetes";

export type GcpKubernetesNodePoolInput = KubernetesNodePoolInput;

export class GcpKubernetesNodePool implements PlatformKubernetesNodePool {
  constructor({
    name,
    kubernetes,
    count,
    nodeType = "e2-medium",
  }: GcpKubernetesNodePoolInput) {
    globalTerraform.resource("google_container_node_pool", name, {
      name: name,
      location: kubernetes.cluster.attr("location"),
      cluster: kubernetes.cluster.attr("name"),
      node_count: count,
      node_config: {
        machine_type: nodeType,
      },
    });
  }
}
