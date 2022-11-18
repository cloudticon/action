import * as k8s from "@kubernetes/client-node";
import { getCreds } from "../utils/getCreds";

let client: k8s.AppsV1Api;
let config: k8s.KubeConfig;
export const initKubeClient = async () => {
  if (!client) {
    const { kubeconfig } = await getCreds();
    config = new k8s.KubeConfig();
    config.loadFromString(kubeconfig);

    client = config.makeApiClient(k8s.AppsV1Api);
  }
  return { client, config };
};
