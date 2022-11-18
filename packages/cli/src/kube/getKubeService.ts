import { initKubeClient } from "./initKubeClient";
import { kubeDebug } from "./kubeDebug";

type Params = {
  namespace: string;
  name: string;
};
export const getKubeService = async ({ name, namespace }: Params) => {
  const { core } = await initKubeClient();
  kubeDebug("get service", namespace, name);
  return core.readNamespacedService(name, namespace).then((res) => res.body);
};
