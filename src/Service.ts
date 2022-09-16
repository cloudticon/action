import { map } from "terraform-generator";
import { context } from "./context";
import { DockerImage } from "./DockerImage";
import { Input } from "./types";
import { Resource } from "terraform-generator/dist/blocks";
import { getNamespace } from "./utils/getNamespace";
import {
  registerGlobalService,
  globalTerraform,
} from "./utils/compileAndRequireCtFile";
import { getDockerCreds } from "./utils/setupCreds";
import { getSentry } from "./utils/getSentry";

export type ServiceBuildInput = {
  context: string;
  dockerfile?: string;
  dependsOn?: Resource[];
};

export type ServiceVolume = {
  name: string;
  path: string;
  size: string;
};

export type ServiceHealthCheck = {
  path: string;
};

export type ServiceInput = {
  name: string;
  command?: string;
  image?: Input<string>;
  build?: boolean | ServiceBuildInput;
  port?: number;
  count?: number;
  customDomain?: Input<string>;
  links?: Service[];
  env?: Record<string, Input<string>>;
  isDefaultService?: boolean;
  autoscaling?: boolean;
  volumes?: ServiceVolume[];
  checks?: ServiceHealthCheck[];
  publicPrefixes?: string[];
  resources?: any;
};

export class Service {
  public host: Input<string>;
  public envs: Record<string, Input<string>>;
  public checks: ServiceHealthCheck[];
  public volumes: ServiceVolume[];
  public kubeService: Resource;
  public kubeDeployment: Resource;
  public kubeIngress: Resource;
  public publicPrefixes: string[];
  public dockerImage: DockerImage;
  public deployType: "kubernetes_stateful_set" | "kubernetes_deployment_v1";

  get name() {
    return this.input.name;
  }

  get port() {
    return this.input.port;
  }

  get publicUrl() {
    return this.getPublicUrl("https");
  }

  get linkUrl() {
    return `${this.name}:${this.port}`;
  }

  getPublicUrl(protocol: string) {
    return `${protocol}://${this.host}`;
  }

  constructor(public input: ServiceInput) {
    this.host = input.customDomain
      ? input.customDomain
      : `${context.repository}-${this.name}-${context.branch}.dev2.cloudticon.com`;
    this.envs = input.env || {};
    this.checks = input.checks || [];
    this.volumes = input.volumes || [];
    this.publicPrefixes = input.publicPrefixes || ["/"];
    if (input.build) {
      const creds = getDockerCreds();
      this.dockerImage = new DockerImage({
        name: this.name,
        image: `${creds.url}/${context.project}/${this.name}:${process.env.GITHUB_SHA}`,
        build: true,
        ...(typeof input.build !== "boolean" ? input.build : {}),
      });
    } else {
      this.dockerImage = new DockerImage({
        name: this.name,
        image: input.image,
      });
    }
    this.deployType = this.volumes.length
      ? "kubernetes_stateful_set"
      : "kubernetes_deployment_v1";

    this.kubeService = new Resource("kubernetes_service", this.name);
    this.kubeDeployment = new Resource(this.deployType, this.name);
    this.kubeIngress = new Resource("kubernetes_ingress_v1", this.name);

    const sentry = getSentry();
    if (sentry) {
      this.env("SENTRY_DSN", sentry.dns);
      this.env("SENTRY_NAME", this.name);
      this.env("SENTRY_ENVIRONMENT", context.branch);
    }
    registerGlobalService(this);
  }

  env(name: string, value: Input<string>) {
    this.envs[name] = value;
    return this;
  }

  check(path: string) {
    this.checks.push({ path });
    return this;
  }

  link(service: Service) {
    return this;
  }

  toTf() {
    this.kubeService = globalTerraform.resource(
      "kubernetes_service",
      this.name,
      {
        metadata: {
          name: this.name,
          namespace: getNamespace(),
          labels: map({
            ct_service: this.name,
          }),
        },
        spec: {
          selector: map({
            ct_service: this.name,
          }),
          port: {
            port: this.port,
            target_port: this.port,
          },
          type: "ClusterIP",
        },
      }
    );

    const deployArgs: any = {
      metadata: {
        name: this.name,
        namespace: getNamespace(),
        labels: map({
          ct_service: this.name,
        }),
      },
      spec: {
        replicas: this.input.count,
        selector: {
          match_labels: map({
            ct_service: this.name,
          }),
        },
        template: {
          metadata: {
            name: this.name,
            labels: map({
              ct_service: this.name,
            }),
          },
          spec: {
            image_pull_secrets: [
              {
                name: "ct-registry",
              },
            ],
            container: {
              name: this.name,
              image: this.dockerImage.image,
              env: Object.entries(this.envs).map(([name, value]) => ({
                name,
                value,
              })),
              liveness_probe: this.checks.map((check) => ({
                http_get: {
                  path: check.path,
                  port: this.port,
                },
              })),
            },
          },
        },
      },
      depends_on: [this.dockerImage.buildResource],
    };
    if (this.volumes.length) {
      deployArgs.spec.service_name = this.name;
      deployArgs.spec.template.spec.container.volume_mount = this.volumes.map(
        (v) => ({
          name: `${this.name}-${v.name}-data`,
          mount_path: v.path,
        })
      );
      deployArgs.spec.volume_claim_template = this.volumes.map((v) => ({
        metadata: {
          name: `${this.name}-${v.name}-data`,
        },
        spec: {
          access_modes: ["ReadWriteOnce"],
          storage_class_name: "csi-cinder-high-speed",
          resources: {
            requests: map({
              storage: v.size,
            }),
          },
        },
      }));
    }
    this.kubeDeployment = globalTerraform.resource(
      this.deployType,
      this.name,
      deployArgs
    );

    this.kubeIngress = globalTerraform.resource(
      "kubernetes_ingress_v1",
      this.name,
      {
        metadata: {
          name: this.name,
          namespace: getNamespace(),
          annotations: map({
            // '"cert-manager.io/cluster-issuer"': "letsencrypt-prod",
            // '"acme.cert-manager.io/http01-edit-in-place"': "true",
            // '"kubernetes.io/ingress.class"': "haproxy",
            // '"haproxy-ingress.github.io/balance-algorithm"': "roundrobin",
            // '"haproxy-ingress.github.io/blue-green-deploy"':
            //   "group=blue=1,group=green=1",
            // '"haproxy-ingress.github.io/blue-green-mode"': "pod",
            // '"haproxy-ingress.github.io/ssl-redirect"': "false",
          }),
        },
        spec: {
          ingress_class_name: "haproxy",
          tls: {
            hosts: [this.host],
          },
          rule: {
            host: this.host,
            http: {
              path: this.publicPrefixes.map((p) => ({
                path: p,
                path_type: "Prefix",
                backend: {
                  service: {
                    name: this.name,
                    port: {
                      number: this.port,
                    },
                  },
                },
              })),
            },
          },
        },
      }
    );
  }
}
