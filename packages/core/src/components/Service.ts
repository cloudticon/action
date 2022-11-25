import { list, map } from "terraform-generator";
import { context } from "../context";
import { DockerImage } from "../DockerImage";
import { Input } from "../types";
import { getNamespace } from "../utils/getNamespace";
import {
  registerGlobalService,
  globalTerraform,
} from "../utils/compileAndRequireCtFile";
import { getCtCreds, getDockerCreds } from "../utils/setupCreds";
import { getSentry } from "../utils/getSentry";
import { isMaster } from "../utils/isMaster";
import { NginxCache } from "./index";
import { resource, TfResource } from "../tfResource";
import { Resource } from "terraform-generator";

export type ServiceSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ServiceNode = "prod" | "dev";
export type ServiceBuildInput = {
  context: string;
  dockerfile?: string;
  dependsOn?: Resource[];
};

export type ServiceVolume = {
  name: string;
  path: string;
  size: Input<string>;
};

export type ServiceHealthCheck = {
  path: string;
  initialDelaySeconds?: number;
};

export type ServiceResources = {
  requests: { cpu: string; memory: string };
  limits: { cpu: string; memory: string };
};
export type ServiceInput = {
  name: string;
  command?: Input<string>[];
  args?: Input<string>[];
  image?: Input<string>;
  build?: boolean | ServiceBuildInput;
  port?: number;
  count?: number;
  customDomain?: Input<string>;
  customDomains?: Input<string>[];
  links?: Service[];
  env?: Record<string, Input<string>>;
  isDefaultService?: boolean;
  autoscaling?: boolean;
  volumes?: ServiceVolume[];
  checks?: ServiceHealthCheck;
  publicPrefixes?: string[];
  resources?: ServiceResources;
  devCommand?: Input<string>[];
  size?: ServiceSize;
  node?: ServiceNode;
  proxyCache?: boolean;
};

const serviceSizes: Record<ServiceSize, ServiceResources> = {
  xs: {
    requests: {
      cpu: "50m",
      memory: "64Mi",
    },
    limits: {
      cpu: "100m",
      memory: "128Mi",
    },
  },
  sm: {
    requests: {
      cpu: "100m",
      memory: "128Mi",
    },
    limits: {
      cpu: "250m",
      memory: "256Mi",
    },
  },
  md: {
    requests: {
      cpu: "200m",
      memory: "256Mi",
    },
    limits: {
      cpu: "500m",
      memory: "512Mi",
    },
  },
  lg: {
    requests: {
      cpu: "200m",
      memory: "256Mi",
    },
    limits: {
      cpu: "250m",
      memory: "256Mi",
    },
  },
  xl: {
    requests: {
      cpu: "200m",
      memory: "256Mi",
    },
    limits: {
      cpu: "250m",
      memory: "256Mi",
    },
  },
};
export class Service {
  public customDomain: Input<string>;
  public host: Input<string>;
  public command?: Input<string>[];
  public args?: Input<string>[];
  public devCommand?: Input<string>[];
  public envs: Record<string, Input<string>>;
  public healthCheck: ServiceHealthCheck;
  public volumes: ServiceVolume[];
  public kubeService: TfResource;
  public kubeDeployment: TfResource;
  public kubeIngress: TfResource;
  public publicPrefixes: string[];
  public dockerImage: DockerImage;
  public resources?: ServiceResources;
  public size?: ServiceSize;
  public node: ServiceNode;
  public deployType: "kubernetes_stateful_set" | "kubernetes_deployment_v1";
  public proxyCache: boolean;

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
    this.customDomain = input.customDomain;
    this.host = input.customDomain ? input.customDomain : this.getDefaultHost();
    this.command = input.command;
    this.args = input.args;
    this.devCommand = input.devCommand;
    this.envs = input.env || {};
    this.healthCheck = input.checks;
    this.size = input.size || "sm";
    this.resources = input.resources || serviceSizes[this.size];
    this.volumes = input.volumes || [];
    this.publicPrefixes = input.publicPrefixes || ["/"];
    this.node = input.node || isMaster() ? "prod" : "dev";
    this.proxyCache = input.proxyCache || false;
    if (input.build) {
      console.log({
        name: this.name,
        build: input.build,
      });
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

    const sentry = getSentry();
    if (sentry) {
      this.env("SENTRY_DSN", sentry.dns);
      this.env("SENTRY_NAME", this.name);
      this.env("SENTRY_ENVIRONMENT", context.branch);
    }
    this.kubeService = resource(
      globalTerraform,
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

    const nodePools = [this.node, `${this.node}-auto`];
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
            affinity: {
              node_affinity: {
                required_during_scheduling_ignored_during_execution: {
                  node_selector_term: [
                    {
                      match_expressions: [
                        { key: "nodepool", operator: "In", values: nodePools },
                      ],
                    },
                  ],
                },
              },
            },
            image_pull_secrets: [
              {
                name: "ct-registry",
              },
            ],
            container: {
              name: this.name,
              image: this.dockerImage.image,
              command: this.command,
              args: this.args,
              env: Object.entries(this.envs).map(([name, value]) => ({
                name,
                value,
              })),
              resources: {
                requests: map(this.resources.requests),
                limits: map(this.resources.limits),
              },
              liveness_probe: this.healthCheck
                ? {
                    initial_delay_seconds: this.healthCheck.initialDelaySeconds,
                    http_get: {
                      path: this.healthCheck.path,
                      port: this.port,
                    },
                  }
                : undefined,
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
    this.kubeDeployment = resource(
      globalTerraform,
      this.deployType,
      this.name,
      deployArgs
    );

    // if (this.customDomain) {
    //   const zone = globalTerraform.data("cloudflare_zone", "zone", {
    //     name: "futuremind.com.pl",
    //   });
    //   globalTerraform.resource("cloudflare_record", "custom_domain", {
    //     zone_id: zone.attr("id"),
    //     name: this.customDomain,
    //     value: getCtCreds().baseIp,
    //     type: "A",
    //     proxied: true,
    //   });
    // }
    let ingressHost = this.host;
    let ingressService = this.name;
    let ingressPort = this.port;

    if (this.proxyCache) {
      const nginxCache = new NginxCache({
        name: `${this.name}-proxy-cache`,
        proxyTo: this.linkUrl,
      });
      ingressService = nginxCache.name;
      ingressPort = nginxCache.port;
    }
    this.kubeIngress = resource(
      globalTerraform,
      "kubernetes_ingress_v1",
      this.name,
      {
        metadata: {
          name: this.name,
          namespace: getNamespace(),
          annotations: this.customDomain
            ? map({
                '"cert-manager.io/cluster-issuer"': "letsencrypt-prod",
              })
            : map({}),
        },
        spec: {
          ingress_class_name: "haproxy",
          tls: {
            hosts: [ingressHost],
            secret_name: this.customDomain ? this.customDomain : undefined,
          },
          rule: {
            host: ingressHost,
            http: {
              path: this.publicPrefixes.map((p) => ({
                path: p,
                path_type: "Prefix",
                backend: {
                  service: {
                    name: ingressService,
                    port: {
                      number: ingressPort,
                    },
                  },
                },
              })),
            },
          },
        },
      }
    );
    // registerGlobalService(this);
  }

  env(name: string, value: Input<string>) {
    return this;
  }

  check(path: string) {
    this.healthCheck = { path };
    return this;
  }

  link(service: Service) {
    return this;
  }

  getDefaultHost() {
    const creds = getCtCreds();
    return `${context.project}-${context.repository}-${context.branch}.${creds.baseDomain}`;
  }
}
