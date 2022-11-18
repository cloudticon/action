import * as k8s from "@kubernetes/client-node";
import * as net from "net";
import { initKubeClient } from "./initKubeClient";
import { kubeDebug } from "./kubeDebug";
import { PassThrough } from "stream";

type Params = {
  namespace: string;
  pod: string;
  podPort: number;
  localPort: number;
  host?: string;
};
export const portForwardToKubePod = async ({
  namespace,
  pod,
  podPort,
  localPort,
  host = "127.0.0.1",
}: Params) => {
  const { config } = await initKubeClient();
  const forward = new k8s.PortForward(config);
  kubeDebug("port forward", namespace, `${podPort}:${localPort}`);
  const server = net.createServer((socket) => {
    forward.portForward(namespace, pod, [podPort], socket, null, socket);
  });

  server.listen(localPort, host);
};
