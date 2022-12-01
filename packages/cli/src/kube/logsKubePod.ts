import { initKubeClient } from "./initKubeClient";
import { kubeDebug } from "./kubeDebug";
import { KubeConfig, Log } from "@kubernetes/client-node";
import { PassThrough } from "stream";

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
  const stream = new PassThrough();
  logs({ config, container, namespace, pod, stream });
  return stream;
};

type LogsInput = {
  config: KubeConfig;
  namespace: string;
  pod: string;
  container: string;
  stream: PassThrough;
  sinceTime?: string;
};
const logs = ({
  config,
  namespace,
  pod,
  stream,
  container,
  sinceTime,
}: LogsInput) => {
  const logClient = new Log(config);
  kubeDebug(`get pod logs ${namespace}/${pod}`, { sinceTime });
  // @ts-ignore
  logClient
    .log(namespace, pod, container, stream, {
      follow: true,
      sinceTime,
    })
    .then((req) => {
      req.on("close", () => {
        kubeDebug(`logs request closed ${namespace}/${pod}`);
        sinceTime = new Date().toISOString();
        logs({ config, namespace, pod, stream, container, sinceTime });
      });
    });
};
