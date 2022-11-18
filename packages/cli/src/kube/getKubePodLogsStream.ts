import { initKubeClient } from "./initKubeClient";
import { kubeDebug } from "./kubeDebug";
import { Log } from "@kubernetes/client-node";
import { WritableStream } from "stream/web";
import { Writable } from "stream";

type GetPodLogsParams = {
  namespace: string;
  pod: string;
  container?: string;
};
export const getKubePodLogsStream = async ({
  namespace,
  pod,
  container,
}: GetPodLogsParams) => {
  const { config } = await initKubeClient();
  kubeDebug(`get pod logs ${namespace}/${pod}`);
  const stream = new Writable();

  (async () => {
    const logClient = new Log(config);
    await logClient.log(namespace, pod, container, stream, {
      follow: true,
    });
  })();

  return stream;
};
