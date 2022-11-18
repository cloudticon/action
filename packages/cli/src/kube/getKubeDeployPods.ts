import { getKubePods } from "./getKubePods";

type GetPodsProps = {
  namespace: string;
  name: string;
};

export const getKubeDeployPods = async ({ name, namespace }: GetPodsProps) => {
  const pods = await getKubePods({ namespace });
  return pods.filter((p) => p.metadata.name.startsWith(name));
};
