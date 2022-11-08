import { Input } from "../types";
import { Ingress, IngressInput } from "./Ingress";
import { Service } from "../Service";

export type RouteInput = {
  name: string;
  host: Input<string>;
  generateCert?: boolean;
  paths?: Input<string>[];
  rewrite?: Input<string>;
  service: Service;
};
export class Route {
  hosts: string[];

  constructor({
    name,
    host,
    generateCert = true,
    paths = ["/"],
    rewrite,
    service,
  }: RouteInput) {
    const annotations: Record<string, Input<string>> = {};
    let tls: IngressInput["tls"];
    if (generateCert) {
      annotations['"cert-manager.io/cluster-issuer"'] = "letsencrypt-prod";
      tls = {
        hosts: [host],
        secretName: host,
      };
    }
    if (rewrite) {
      annotations['"haproxy-ingress.github.io/rewrite-target"'] = rewrite;
    }

    new Ingress({
      name,
      annotations,
      tls,
      rules: [
        {
          host,
          paths: paths.map((path) => ({
            path,
            backend: {
              name: service.name,
              port: {
                number: service.port,
              },
            },
          })),
        },
      ],
    });
  }
}
