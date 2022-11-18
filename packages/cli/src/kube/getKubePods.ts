import { initKubeClient } from "./initKubeClient";
import { kubeDebug } from "./kubeDebug";

type GetPodsProps = {
  namespace: string;
  fieldSelector?: string;
};

export const getKubePods = async ({
  namespace,
  fieldSelector,
}: GetPodsProps) => {
  const { core } = await initKubeClient();
  kubeDebug("get pods", namespace);
  const res = await core.listNamespacedPod(
    namespace,
    undefined,
    undefined,
    undefined,
    fieldSelector
  );
  return res.body.items;
};
