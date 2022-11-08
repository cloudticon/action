import { Input } from "../types";
import { globalTerraform } from "../utils/compileAndRequireCtFile";
import { getNamespace } from "../utils/getNamespace";
import { map } from "terraform-generator";

export type IngressInput = {
  name: string;
  annotations?: Record<string, Input<string>>;
  tls?: {
    hosts: Input<string>[];
    secretName?: Input<string>;
  };
  rules: {
    host: Input<string>;
    paths: {
      path: Input<string>;
      backend: {
        name: Input<string>;
        port: {
          number: Input<number>;
        };
      };
    }[];
  }[];
};
export class Ingress {
  constructor({ name, rules, annotations = {}, tls }: IngressInput) {
    globalTerraform.resource("kubernetes_ingress_v1", name, {
      metadata: {
        name: name,
        namespace: getNamespace(),
        annotations: map(annotations),
      },
      spec: {
        ingress_class_name: "haproxy",
        tls: tls
          ? {
              hosts: tls.hosts,
              secret_name: tls.secretName,
            }
          : undefined,
        rule: rules.map(({ paths, ...rule }) => ({
          ...rule,
          http: {
            path: paths.map(({ path, backend }) => ({
              path,
              path_type: "Prefix",
              backend: {
                service: backend,
              },
            })),
          },
        })),
      },
    });
  }
}
