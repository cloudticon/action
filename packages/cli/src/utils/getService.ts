import createDebug from "debug";
import { getKubeDeploy, getKubeDeployPods, logsKubePod } from "../kube";
import { V1Deployment, V1Pod } from "@kubernetes/client-node";
import { PassThrough } from "stream";
import { DevMode } from "./DevMode";

const debug = createDebug("service");

export class Service {
  public deploy: V1Deployment;
  public devMode: DevMode = new DevMode(this);
  private logsStream: PassThrough;

  constructor(public name: string, public namespace: string) {}

  async getDeployment() {
    return getKubeDeploy({
      name: this.name,
      namespace: this.namespace,
    });
  }

  async logs() {
    if (this.logsStream) {
      return;
    }
    const { name, container } = await this.getPodNameAndContainer();
    const stream = await logsKubePod({
      namespace: this.namespace,
      pod: name,
      container,
    });
    stream.pipe(process.stdout);
    this.logsStream = stream;
  }

  stopLogs() {
    if (this.logsStream) {
      this.logsStream.destroy();
      this.logsStream = undefined;
    }
  }

  async getPodNameAndContainer() {
    const pods = await getKubeDeployPods({
      namespace: this.namespace,
      name: this.name,
    });
    let latest: V1Pod;
    for (let pod of pods) {
      if (
        !latest ||
        new Date(latest.status.startTime).getTime() <
          new Date(pod.status.startTime).getTime()
      ) {
        latest = pod;
      }
    }
    return {
      name: latest.metadata.name,
      container: latest.spec.containers[0].name,
    };
  }
}

export const getService = async (name: string, namespace: string) => {
  return new Service(name, namespace);
};
