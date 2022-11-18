import { initKubeClient } from "./initKubeClient";
import { kubeDebug } from "./kubeDebug";

type Params = {
  namespace: string;
  name: string;
};
export const getKubeWorkload = async ({ name, namespace }: Params) => {
  const { apps } = await initKubeClient();
  kubeDebug("get workload", namespace, name);
  return Promise.all([
    apps
      .readNamespacedDeployment(name, namespace)
      .then((res) => res.body)
      .catch(() => {}),
    apps
      .readNamespacedStatefulSet(name, namespace)
      .then((res) => res.body)
      .catch(() => {}),
  ]).then((w) => w.find((w) => w));
};
