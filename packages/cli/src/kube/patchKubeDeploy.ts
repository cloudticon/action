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
  const { client } = await initKubeClient();
  kubeDebug("patch deployment", namespace, name, body);
  // console.log(body);
  // process.exit();
  await client.patchNamespacedDeployment(
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
        "content-type": "application/merge-patch+json",
      },
    }
  );
};
