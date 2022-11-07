import { Input } from "../types";
import { globalTerraform } from "../utils/compileAndRequireCtFile";
import { getNamespace } from "../utils/getNamespace";
import { map } from "terraform-generator";

export type RouteInput = {
  name: string;
  redirectForm?: Input<string>;
  tlsHosts: Input<string>[];
  rules: {
    host: string;
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
export class Route {
  constructor({ name, rules, redirectForm, tlsHosts }: RouteInput) {
    globalTerraform.resource("kubernetes_ingress_v1", name, {
      metadata: {
        name: name,
        namespace: getNamespace(),
        annotations: map({
          '"cert-manager.io/cluster-issuer"': "letsencrypt-prod",
          ...(redirectForm
            ? {
                '"haproxy-ingress.github.io/redirect-from"': redirectForm,
              }
            : {}),
        }),
      },
      spec: {
        ingress_class_name: "haproxy",
        tls: {
          hosts: tlsHosts,
          secret_name: `${name}_tls`,
        },
        rule: rules.map((rule) => ({
          ...rule,
          path: rule.paths.map((path) => ({
            ...path,
            path_type: "Prefix",
          })),
        })),
      },
    });
  }
}
