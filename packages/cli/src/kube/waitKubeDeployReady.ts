import { initKubeClient } from "./initKubeClient";
import { V1Deployment, Watch } from "@kubernetes/client-node";
import { kubeDebug } from "./kubeDebug";

type GetDeployProps = {
  namespace: string;
  name: string;
};

export const waitKubeDeployReady = ({ namespace, name }: GetDeployProps) => {
  return new Promise<void>(async (resolve, reject) => {
    const { config } = await initKubeClient();
    kubeDebug("watch deploy", namespace, name);
    const url = `/apis/apps/v1/namespaces/${namespace}/deployments`;
    const watch = new Watch(config);
    const req = await watch.watch(
      url,
      {
        allowWatchBookmarks: true,
        fieldSelector: `metadata.name=${name}`,
      },
      (event, deploy: V1Deployment) => {
        const isReady =
          deploy.status.updatedReplicas === deploy.status.replicas;

        kubeDebug("watch deploy event", namespace, name, event);
        if (isReady) {
          req.abort();
          resolve();
          kubeDebug("watch deploy done", namespace, name);
        }
      },
      (e) => {
        if (e) {
          reject(e);
        }
      }
    );
  });
};
