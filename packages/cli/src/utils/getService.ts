import { kubectl, kubectlJson, kubectlStream } from "./kubectl";
import { containerShell } from "./containerShell";
import { ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs";
import createDebug from "debug";
import path from "path";

const debug = createDebug("service");

type Deploy = {
  metadata: {
    annotations: Record<string, string>;
    name: string;
  };
  spec: {
    template: {
      spec: {
        containers: {
          image: string;
          command?: string[];
          args?: string[];
        }[];
      };
    };
  };
};

class Service {
  private deploy: Deploy;
  private process: ChildProcessWithoutNullStreams;
  private devProcess: ChildProcessWithoutNullStreams;

  constructor(public name: string, public namespace: string) {}

  get hasDevProcess() {
    return !!this.devProcess;
  }
  get isDevMode() {
    return this.deploy.metadata.annotations["ct-dev-mode"] === "true";
  }

  async refresh() {
    this.deploy = await getDeploy(this.name, this.namespace);
  }

  logs() {
    this.stopProcess();
    this.process = kubectlStream([
      "logs",
      "-f",
      `deploy/${this.name}`,
      "-n",
      this.namespace,
    ]);
    this.process.stdout.pipe(process.stdout);
    this.process.stderr.pipe(process.stderr);
  }

  shell() {
    this.stopProcess();
    kubectlStream(
      ["exec", "-it", `deploy/${this.name}`, "-n", this.namespace, "--", "ash"],
      {
        cwd: process.cwd(),
        detached: true,
        stdio: "inherit",
      }
    );
    // this.process.stdout.pipe(process.stdout);
    // this.process.stderr.pipe(process.stderr);
    // process.stdin.pipe(this.process.stdin);
  }

  stopProcess() {
    if (this.process) {
      this.process.stdout.destroy();
      this.process.stderr.destroy();
      this.process.stdin.destroy();
      this.process.kill("SIGINT");
    }
  }

  async getPodName() {
    const { items } = await kubectlJson([
      "get",
      "pod",
      "-n",
      this.namespace,
      "-o",
      "json",
    ]);
    const pod = items.find((p) => p.metadata.name.startsWith(this.name));
    return pod.metadata.name;
  }

  async devMode(outDir: string) {
    // await this.devModeOff();
    if (!this.isDevMode) {
      this.stopProcess();
      console.log("turning on dev mode....");
      await patchDeploy(this.name, this.namespace, [
        { op: "add", path: "/metadata/annotations/ct-dev-mode", value: "true" },
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
      ]);
      await waitForDeployAvailable(this.name, this.namespace);
      await this.refresh();
      const podName = await this.getPodName();
      await new Promise((resolve) => setTimeout(resolve, 4000));
      this.startDevProcess();
    }
    console.log("dev mode on");
  }

  startDevProcess() {
    if (this.hasDevProcess) {
      return;
    }

    this.devProcess = kubectlStream([
      "exec",
      "-i",
      `deploy/${this.name}`,
      "-n",
      this.namespace,
      "--",
      "ash",
    ]);
    this.devProcess.stdout.on("data", (data) => {
      debug(data.toString());
    });
    this.devProcess.stderr.on("data", (data) => {
      debug("stderr: " + data.toString());
    });
    this.devProcess.on("close", (code) => {
      console.log("dev process closed", code);
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
      this.stopProcess();
      if (this.devProcess) {
        this.devProcess.stdout.destroy();
        this.devProcess.stderr.destroy();
        this.devProcess.stdin.destroy();
        this.devProcess.kill("SIGINT");
      }
      const snapshot = JSON.parse(
        this.deploy.metadata.annotations["ct-dev-snapshot"]
      );
      await patchDeploy(this.name, this.namespace, [
        { op: "remove", path: "/metadata/annotations/ct-dev-mode" },
        { op: "remove", path: "/metadata/annotations/ct-dev-snapshot" },
        { op: "replace", path: "/spec", value: snapshot },
      ]);
      await waitForDeployAvailable(this.name, this.namespace);
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

export const patchDeploy = async (
  name: string,
  namespace: string,
  data: any
) => {
  await kubectl([
    "patch",
    "deployment",
    name,
    "-n",
    namespace,
    "--type",
    "json",
    "-p",
    JSON.stringify(data),
  ]);
};

export const getDeploy = async (name: string, namespace: string) => {
  const deploy = await kubectlJson([
    "get",
    "deploy",
    name,
    "-o",
    "json",
    "-n",
    namespace,
  ]);
  const condition = deploy.status.conditions.find(
    (c) => c.type === "Available"
  );
  deploy.isReady = condition.status === "True";
  return deploy;
};

export const waitForDeployAvailable = async (
  name: string,
  namespace: string
) => {
  const check = async (done: () => any) => {
    const deploy = await getDeploy(name, namespace);
    if (deploy.isReady) {
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
