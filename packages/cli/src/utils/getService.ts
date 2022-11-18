import { ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs";
import createDebug from "debug";
import path from "path";
import { getKubeDeploy } from "../kube/getKubeDeploy";
import { isKubeDeployReady } from "../kube/isKubeDeployReady";
import { V1Deployment, V1Pod } from "@kubernetes/client-node";
import { logsKubePod, getKubePods } from "../kube";
import { PassThrough, Stream } from "stream";
import { patchKubeDeploy } from "../kube/patchKubeDeploy";
import { execKubePod, ExecKubeProcess } from "../kube/execKubePod";
import { waitKubeDeployReady } from "../kube/waitKubeDeployReady";
import { getKubeDeployPods } from "../kube/getKubeDeployPods";

const debug = createDebug("service");

class Service {
  private deploy: V1Deployment;
  private devProcess: ExecKubeProcess;
  private logsStream: PassThrough;

  constructor(public name: string, public namespace: string) {}

  get hasDevProcess() {
    return !!this.devProcess;
  }
  get isDevMode() {
    return this.deploy.metadata.annotations["ct-dev-mode"] === "true";
  }

  async refresh() {
    this.deploy = await getKubeDeploy({
      name: this.name,
      namespace: this.namespace,
    });
  }

  async logs() {
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

  async devMode(outDir: string) {
    if (!this.isDevMode) {
      console.log("turning on dev mode....");
      await patchKubeDeploy({
        namespace: this.namespace,
        name: this.name,
        body: [
          {
            op: "add",
            path: "/metadata/annotations/ct-dev-mode",
            value: "true",
          },
          {
            op: "add",
            path: "/metadata/annotations/ct-dev-snapshot",
            value: JSON.stringify(this.deploy.spec),
          },
          {
            op: "replace",
            path: "/spec/replicas",
            value: 1,
          },
          {
            op: "replace",
            path: "/spec/template/spec/containers/0/command",
            value: [
              "npx",
              "nodemon",
              "--verbose",
              "--watch",
              `/app/${outDir}/**`,
              "--ext",
              "js",
              "--delay",
              "0.5",
              "--exec",
              "yarn start",
            ],
          },
          {
            op: "replace",
            path: "/spec/template/spec/affinity/nodeAffinity/requiredDuringSchedulingIgnoredDuringExecution/nodeSelectorTerms/0/matchExpressions/0/values",
            value: ["prod-auto", "prod"],
          },
          // {
          //   op: "remove",
          //   path: "/spec/template/spec/containers/0/livenessProbe",
          // },
          // {
          //   op: "remove",
          //   path: "/spec/template/spec/containers/0/readinessProbe",
          // },
        ],
      });
      await waitKubeDeployReady({ name: this.name, namespace: this.namespace });
      await this.refresh();
      await this.startDevProcess();
    }
    console.log("dev mode on");
  }

  async startDevProcess() {
    if (this.hasDevProcess) {
      return;
    }
    const { name, container } = await this.getPodNameAndContainer();
    this.devProcess = await execKubePod({
      namespace: this.namespace,
      name,
      container,
      command: "ash",
    });
    this.devProcess.stdout.on("data", (data) => {
      debug(data.toString());
    });
    this.devProcess.stderr.on("data", (data) => {
      debug("stderr: " + data.toString());
    });
    this.devProcess.on("close", (code) => {
      console.log("dev process closed", JSON.stringify(code, null, 2));
      this.devProcess = null;
      if (code === 137) {
        console.log("dev reconnect");
        this.startDevProcess();
      }
    });
  }
  copyFile(src: string, dist: string) {
    if (this.isDevMode) {
      const content = fs.readFileSync(src, "base64");
      debug(`copy file ${src} to ${dist}`);
      const distPath = path.dirname(dist);
      this.runDevCmd(`mkdir -p ${distPath}`);
      this.runDevCmd(`echo "${content}" | base64 -d > ${dist}`);
    }
  }

  rm(path: string) {
    this.runDevCmd(`rm -rf ${path}`);
  }

  runDevCmd(cmd: string) {
    debug(`dev: ${cmd}`);
    this.devProcess.stdin.write(`${cmd}\n`);
  }
  async devModeOff() {
    if (this.isDevMode) {
      console.log("turn off dev mode...");
      if (this.devProcess) {
        this.devProcess.close();
        // this.devProcess.stdout.destroy();
        // this.devProcess.stderr.destroy();
        // this.devProcess.stdin.destroy();
        // this.devProcess.kill("SIGINT");
      }
      const snapshot = JSON.parse(
        this.deploy.metadata.annotations["ct-dev-snapshot"]
      );
      await patchKubeDeploy({
        name: this.name,
        namespace: this.namespace,
        body: [
          { op: "remove", path: "/metadata/annotations/ct-dev-mode" },
          { op: "remove", path: "/metadata/annotations/ct-dev-snapshot" },
          { op: "replace", path: "/spec", value: snapshot },
        ],
      });
      await waitKubeDeployReady({ name: this.name, namespace: this.namespace });
      await this.refresh();
    }
    console.log("dev mode off");
  }
}

export const getService = async (name: string, namespace: string) => {
  const service = new Service(name, namespace);
  await service.refresh();
  return service;
};
