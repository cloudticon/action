import { globalTerraform } from "../utils/compileAndRequireCtFile";
import { Input } from "../types";
import { LocalFile } from "./LocalFile";
import { context } from "../context";

export type HelmChartInput = {
  name: string;
  repository: Input<string>;
  chart: Input<string>;
  version?: Input<string>;
  values?: Record<string, Input<any>>;
};

export class HelmChart {
  constructor({ name, repository, chart, values, version }: HelmChartInput) {
    globalTerraform.provider("helm", {});

    const valuesFile = new LocalFile({
      name: `${name}-values-file`,
      content: `yamlencode(jsondecode("${JSON.stringify(values)}"))`,
      filename: `${context.workingDir}/${name}-values.yaml`,
    });

    globalTerraform.resource("helm_release", name, {
      repository,
      chart,
      version,
      values: [valuesFile.filename],
    });
  }
}
