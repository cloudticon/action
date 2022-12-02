import { HelmChart } from "@cloudticon/core/lib";

export type HaProxyIngressInput = {
  name: string;
  version?: string;
};
export class HaProxyIngress extends HelmChart {
  constructor({ name, version = "v0.13.9" }: HaProxyIngressInput) {
    super({
      name,
      chart: "haproxy/haproxy-ingress",
      repository: "https://haproxy-ingress.github.io/charts",
      version,
      values: {
        controller: {
          extraArgs: {
            "allow-cross-namespace": "true",
            "default-ssl-certificate": "default/dev2.cloudticon.com",
          },
          ingressClassResource: {
            enabled: true,
          },
          config: {
            "use-proxy-protocol": "true",
          },
          service: {
            annotations: {
              "service.beta.kubernetes.io/ovh-loadbalancer-proxy-protocol":
                "v2",
            },
          },
        },
      },
    });
  }
}
