import * as k8s from "@kubernetes/client-node";
import { getCreds } from "../utils/getCreds";

let apps: k8s.AppsV1Api;
let core: k8s.CoreV1Api;
let config: k8s.KubeConfig;
export const initKubeClient = async () => {
  if (!apps) {
    const { kubeconfig } = await getCreds();
    config = new k8s.KubeConfig();
    config.loadFromString(kubeconfig);

    apps = config.makeApiClient(k8s.AppsV1Api);
    core = config.makeApiClient(k8s.CoreV1Api);
  }
  return { apps, core, config };
};
