import { initKubeClient } from "./initKubeClient";
import { kubeDebug } from "./kubeDebug";

type GetDeployProps = {
  namespace: string;
  name: string;
};

export const getKubeDeploy = async ({ namespace, name }: GetDeployProps) => {
  const { client } = await initKubeClient();
  kubeDebug("get name", namespace, name);
  const res = await client.readNamespacedDeployment(name, namespace);
  return res.body;
};
