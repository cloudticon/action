import { initKubeClient } from "./initKubeClient";
import { kubeDebug } from "./kubeDebug";

type GetPodsProps = {
  namespace: string;
};

export const getKubePods = async ({ namespace }: GetPodsProps) => {
  const { client } = await initKubeClient();
  kubeDebug("get pods", namespace);
  const res = await client.listNamespacedPod(namespace);
  return res.body.items;
};
