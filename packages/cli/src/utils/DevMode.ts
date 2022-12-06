import { Service } from "./getService";
import { patchKubeDeploy } from "../kube/patchKubeDeploy";
import { getKubeDeployPods, waitKubeDeployReady } from "../kube";
import { portForwardToKubePod } from "../kube/portForwardToKubePod";
import axios from "axios";
import * as fs from "fs";
import { V1Deployment } from "@kubernetes/client-node";
import createDebug from "debug";
import { createDeflate } from "zlib";

const debug = createDebug("devMode");

export class DevMode {
  public isStarted: boolean = false;
  private closePortForward?: () => void;
  private devNodeClient = axios.create({
    baseURL: `http://localhost:12543`,
  });
  constructor(public service: Service) {}

  async start() {
    const deployment = await this.service.getDeployment();
    if (this.isDeploymentDevMode(deployment)) {
      debug("Dev mode already started");
      await this.forwardToDevNode();
      return;
    }
    debug("Starting dev mode");
    const patchBody = [
      {
        op: "add",
        path: "/metadata/annotations/ct-dev-mode",
        value: "true",
      },
      {
        op: "add",
        path: "/metadata/annotations/ct-dev-snapshot",
        value: JSON.stringify(deployment.spec),
      },
      {
        op: "replace",
        path: "/spec/replicas",
        value: 1,
      },
      {
        op: "replace",
        path: "/spec/template/spec/containers/0/command",
        value: ["npx", "@cloudticon/node-dev"],
      },
      {
        op: "replace",
        path: "/spec/template/spec/affinity/nodeAffinity/requiredDuringSchedulingIgnoredDuringExecution/nodeSelectorTerms/0/matchExpressions/0/values",
        value: ["prod-auto", "prod"],
      },
      {
        op: "replace",
        path: "/spec/template/spec/containers/0/env",
        value: this.getDevEnvs(deployment),
      },
      {
        op: "replace",
        path: "/spec/template/spec/containers/0/livenessProbe",
        value: {
          httpGet: {
            path: "/health",
            port: 12543,
          },
        },
      },
      {
        op: "replace",
        path: "/spec/template/spec/containers/0/readinessProbe",
        value: {
          httpGet: {
            path: "/health",
            port: 12543,
          },
        },
      },
      // {
      //   op: "remove",
      //   path: "/spec/template/spec/containers/0/readinessProbe",
      // },
    ];
    await this.patchDeployment(patchBody);
    await this.forwardToDevNode();
    this.isStarted = true;
  }

  async stop() {
    const deployment = await this.service.getDeployment();
    if (!this.isDeploymentDevMode(deployment)) {
      return;
    }
    const snapshot = JSON.parse(
      deployment.metadata.annotations["ct-dev-snapshot"]
    );
    const patchBody = [
      { op: "remove", path: "/metadata/annotations/ct-dev-mode" },
      { op: "remove", path: "/metadata/annotations/ct-dev-snapshot" },
      { op: "replace", path: "/spec", value: snapshot },
    ];
    await this.patchDeployment(patchBody);
    await this.closePortForward();
    this.isStarted = false;
  }

  async restartServer() {
    debug("restart dev server");
    await this.devNodeClient.post("/restart", { timeout: 2000 });
  }

  async copyFile(src: string, dist: string) {
    await this.devNodeClient.put(
      dist,
      fs.createReadStream(src).pipe(createDeflate())
    );
  }

  async rmFile(path: string) {
    await this.devNodeClient.delete(path);
  }

  private async patchDeployment(body: any[]) {
    const { namespace, name } = this.service;
    await patchKubeDeploy({
      namespace,
      name,
      body,
    });
    await waitKubeDeployReady({ name, namespace });
  }

  private async forwardToDevNode() {
    const [pod] = await getKubeDeployPods({
      name: this.service.name,
      namespace: this.service.namespace,
    });
    this.closePortForward = await portForwardToKubePod({
      namespace: this.service.namespace,
      pod: pod.metadata.name,
      podPort: 12543,
      localPort: 12543,
    });
  }

  private getDevEnvs(deployment: V1Deployment) {
    return [
      ...(deployment.spec.template.spec.containers[0].env || []),
      ...Object.entries(process.env)
        .filter(([name]) => name.startsWith("CT_"))
        .map(([name, value]) => ({ name: name.replace("CT_", ""), value })),
    ];
  }

  private isDeploymentDevMode(deployment: V1Deployment): boolean {
    return deployment.metadata.annotations["ct-dev-mode"] === "true";
  }
}
