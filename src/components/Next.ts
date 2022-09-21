import { Service, ServiceInput } from "../Service";
import { DotEnv } from "../DotEnv";
import { BuildableJsDockerfileBuilder } from "../Dockerfile";
import { getSentry } from "../utils/getSentry";
import { context } from "../context";

export type NextInput = ServiceInput & {
  name: string;
  size?: any;
  buildEnvExtends?: string[];
  buildEnv?: Record<string, string>;
  resources?: any;
  dockerfile?: string;
  context?: string;
  enableSentry?: boolean;
};

export class Next extends Service {
  public dotEnv?: DotEnv;
  public service: Service;

  public static createDockerFile() {
    return new (class extends BuildableJsDockerfileBuilder {
      beforeBuild(builder) {
        builder.run("mkdir -p /app/public");
      }
      release(builder) {
        builder
          .from("base", "release")
          .workdir("/app")
          .env("NODE_ENV", "production")
          .copy("/app/prod_node_modules", "./node_modules", "dependencies")
          .copy("/app/package.json", "./package.json", "builder")
          .copy("/app/next.config.js", "./next.config.js", "builder")
          .copy("/app/public", "./public", "builder")
          .copy("/app/.next", "./.next", "builder")
          .cmdStart();
      }
    })().build();
  }

  constructor({
    name,
    size = "sm",
    buildEnv,
    buildEnvExtends = [],
    dockerfile = Next.createDockerFile(),
    enableSentry = true,
    ...input
  }: NextInput) {
    let env: any = {};
    let dotEnv: DotEnv;
    const sentry = getSentry();
    if (sentry) {
      env["SENTRY_URL"] = `${sentry.url}/`;
      env["SENTRY_ORG"] = sentry.organization;
      env["SENTRY_PROJECT"] = sentry.project;
      env["SENTRY_AUTH_TOKEN"] = sentry.token;
      env["NEXT_PUBLIC_SENTRY_DSN"] = sentry.dns;
      env["NEXT_PUBLIC_SENTRY_ENVIRONMENT"] = context.branch;
    }

    if (buildEnv) {
      dotEnv = new DotEnv({
        name: `${name}_dot_env`,
        env: {
          ...env,
          ...buildEnv,
        },
        extends: buildEnvExtends,
      });
    }

    super({
      name,
      port: 3000,
      isDefaultService: true,
      build: {
        dockerfile,
        context: ".",
        dependsOn: dotEnv ? [dotEnv.resource] : [],
      },
      ...input,
    });

    this.dotEnv = dotEnv;
  }
}
