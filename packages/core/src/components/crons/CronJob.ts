import { globalTerraform } from "../../utils/compileAndRequireCtFile";
import { getNamespace } from "../../utils/getNamespace";
import { Input } from "../../types";

export type CronJobInput = {
  name: string;
  schedule: Input<string>;
  image: Input<string>;
  env?: Record<string, Input<string>>;
};

export class CronJob {
  constructor({ name, image, schedule, env = {} }: CronJobInput) {
    globalTerraform.resource("kubernetes_cron_job_v1", name, {
      metadata: {
        name,
        namespace: getNamespace(),
      },
      spec: {
        schedule,
        job_template: {
          metadata: {},
          spec: {
            template: {
              metadata: {},
              spec: {
                image_pull_secrets: [
                  {
                    name: "ct-registry",
                  },
                ],
                container: {
                  name,
                  image,
                  env: Object.entries(env).map(([name, value]) => ({
                    name,
                    value,
                  })),
                },
              },
            },
          },
        },
      },
    });
  }
}
