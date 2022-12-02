import { HelmChart } from "@cloudticon/core/lib";

export type CertManagerInput = {
  name: string;
  version?: string;
};
export class CertManager extends HelmChart {
  constructor({ name, version = "v1.9.1" }: CertManagerInput) {
    super({
      name,
      chart: "jetstack/cert-manager",
      repository: "https://charts.jetstack.io",
      version,
      values: {
        installCRDs: "true",
      },
    });
  }
}
