import { initKubeClient } from "./initKubeClient";
import { kubeDebug } from "./kubeDebug";

type PatchKubeDeploy = {
  namespace: string;
  name: string;
  body: any;
};

export const patchKubeDeploy = async ({
  namespace,
  name,
  body,
}: PatchKubeDeploy) => {
  const { apps } = await initKubeClient();
  kubeDebug("patch deployment", namespace, name);
  await apps.patchNamespacedDeployment(
    name,
    namespace,
    body,
    "true",
    undefined,
    undefined,
    undefined,
    undefined,
    {
      headers: {
        "content-type": "application/json-patch+json",
      },
    }
  );
};
