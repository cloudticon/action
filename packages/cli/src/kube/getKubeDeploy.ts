import { initKubeClient } from "./initKubeClient";
import { kubeDebug } from "./kubeDebug";

type GetDeployProps = {
  namespace: string;
  name: string;
};

export const getKubeDeploy = async ({ namespace, name }: GetDeployProps) => {
  const { apps } = await initKubeClient();
  kubeDebug("get deploy", namespace, name);
  const res = await apps.readNamespacedDeployment(name, namespace);
  return res.body;
};
