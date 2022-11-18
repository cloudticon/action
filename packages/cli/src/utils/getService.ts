import { ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs";
import createDebug from "debug";
import path from "path";
import { getKubeDeploy } from "../kube/getKubeDeploy";
import { isKubeDeployReady } from "../kube/isKubeDeployReady";
import { V1Deployment } from "@kubernetes/client-node";
import { getKubePodLogsStream, getKubePods } from "../kube";
import { Stream } from "stream";
import { patchKubeDeploy } from "../kube/patchKubeDeploy";

const debug = createDebug("service");

class Service {
  private deploy: V1Deployment;
  private process: Stream;
  private devProcess: Stream;

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
    this.stopProcess();
    const { name, container } = await this.getPodNameAndContainer();
    await getKubePodLogsStream({
      namespace: this.namespace,
      pod: name,
      container,
    });
  }

  shell() {
    this.stopProcess();
    // kubectlStream(
    //   ["exec", "-it", `deploy/${this.name}`, "-n", this.namespace, "--", "ash"],
    //   {
    //     cwd: process.cwd(),
    //     detached: true,
    //     stdio: "inherit",
    //   }
    // );
    // this.process.stdout.pipe(process.stdout);
    // this.process.stderr.pipe(process.stderr);
    // process.stdin.pipe(this.process.stdin);
  }

  stopProcess() {
    if (this.process) {
      // this.process.stdout.destroy();
      // this.process.stderr.destroy();
      // this.process.stdin.destroy();
      // this.process.kill("SIGINT");
    }
  }

  async getPodNameAndContainer() {
    const pods = await getKubePods({ namespace: this.namespace });
    const pod = pods.find((p) => p.metadata.name.startsWith(this.name));
    return {
      name: pod.metadata.name,
      container: pod.spec.containers[0].name,
    };
  }

  async devMode(outDir: string) {
    // await this.devModeOff();
    if (!this.isDevMode) {
      this.stopProcess();
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
          // {
          //   op: "add",
          //   path: "/metadata/annotations/ct-dev-snapshot",
          //   value: JSON.stringify(this.deploy.spec),
          // },
          // {
          //   op: "replace",
          //   path: "/spec/replicas",
          //   value: 1,
          // },
          // {
          //   op: "replace",
          //   path: "/spec/template/spec/containers/0/command",
          //   value: [
          //     "npx",
          //     "nodemon",
          //     "--verbose",
          //     "--watch",
          //     `/app/${outDir}/**`,
          //     "--ext",
          //     "js",
          //     "--delay",
          //     "0.5",
          //     "--exec",
          //     "yarn start",
          //   ],
          // },
          // {
          //   op: "replace",
          //   path: "/spec/template/spec/affinity/nodeAffinity/requiredDuringSchedulingIgnoredDuringExecution/nodeSelectorTerms/0/matchExpressions/0/values",
          //   value: ["prod-auto", "prod"],
          // },
          // // {
          // //   op: "remove",
          // //   path: "/spec/template/spec/containers/0/livenessProbe",
          // // },
          // // {
          // //   op: "remove",
          // //   path: "/spec/template/spec/containers/0/readinessProbe",
          // // },
        ],
      });
      await waitForDeployAvailable(this.name, this.namespace);
      await this.refresh();
      await new Promise((resolve) => setTimeout(resolve, 4000));
      this.startDevProcess();
    }
    console.log("dev mode on");
  }

  startDevProcess() {
    if (this.hasDevProcess) {
      return;
    }
    //
    // this.devProcess = kubectlStream([
    //   "exec",
    //   "-i",
    //   `deploy/${this.name}`,
    //   "-n",
    //   this.namespace,
    //   "--",
    //   "ash",
    // ]);
    // this.devProcess.stdout.on("data", (data) => {
    //   debug(data.toString());
    // });
    // this.devProcess.stderr.on("data", (data) => {
    //   debug("stderr: " + data.toString());
    // });
    // this.devProcess.on("close", (code) => {
    //   console.log("dev process closed", code);
    //   this.devProcess = null;
    //   if (code === 137) {
    //     console.log("dev reconnect");
    //     this.startDevProcess();
    //   }
    // });
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
    // this.devProcess.stdin.write(`${cmd}\n`);
  }
  async devModeOff() {
    //   if (this.isDevMode) {
    //     console.log("turn off dev mode...");
    //     this.stopProcess();
    //     if (this.devProcess) {
    //       this.devProcess.stdout.destroy();
    //       this.devProcess.stderr.destroy();
    //       this.devProcess.stdin.destroy();
    //       this.devProcess.kill("SIGINT");
    //     }
    //     const snapshot = JSON.parse(
    //       this.deploy.metadata.annotations["ct-dev-snapshot"]
    //     );
    //     await patchDeploy(this.name, this.namespace, [
    //       { op: "remove", path: "/metadata/annotations/ct-dev-mode" },
    //       { op: "remove", path: "/metadata/annotations/ct-dev-snapshot" },
    //       { op: "replace", path: "/spec", value: snapshot },
    //     ]);
    //     await waitForDeployAvailable(this.name, this.namespace);
    //     await this.refresh();
    //   }
    //   console.log("dev mode off");
  }
}

export const getService = async (name: string, namespace: string) => {
  const service = new Service(name, namespace);
  await service.refresh();
  return service;
};

export const waitForDeployAvailable = async (
  name: string,
  namespace: string
) => {
  const check = async (done: () => any) => {
    const deploy = await getKubeDeploy({ name, namespace });
    if (isKubeDeployReady(deploy)) {
      done();
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return check(done);
    }
  };

  return new Promise<void>(async (resolve, reject) => {
    await check(resolve);
  });
};
