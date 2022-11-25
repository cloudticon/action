import { initKubeClient } from "./initKubeClient";
import { kubeDebug } from "./kubeDebug";
import { Log } from "@kubernetes/client-node";
import { WritableStream } from "stream/web";
import { PassThrough, Writable } from "stream";
import { wsKeepAlive } from "../utils/wsKeepAlive";

type GetPodLogsParams = {
  namespace: string;
  pod: string;
  container?: string;
};
export const logsKubePod = async ({
  namespace,
  pod,
  container,
}: GetPodLogsParams) => {
  const { config } = await initKubeClient();
  kubeDebug(`get pod logs ${namespace}/${pod}`);
  const stream = new PassThrough();

  const logClient = new Log(config);
  logClient.log(namespace, pod, container, stream, {
    follow: true,
  });

  return stream;
};
