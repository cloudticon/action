import { PublicContainer, PublicContainerInput } from "./";
import {
  ComponentSize,
  Input,
  ResourceInput,
  SourceScanResult,
} from "../../../types";
import { DotEnv, Service } from "../resources";
import { SentryProject } from "../../sentry";
import { getContext } from "../../../utils";
import { Source } from "../../../core/Source";
import { BuildableJsDockerfileBuilder } from "../../../core/Dockerfile";

export type NextInput = PublicContainerInput &
  Input<{
    name: string;
    size?: ComponentSize;
    buildEnvExtends?: string[];
    buildEnv?: Record<string, string>;
    resources?: ResourceInput;
    dockerfile?: string;
    context?: string;
    enableSentry?: boolean;
  }>;

export class Next extends PublicContainer {
  static sizeResources: Record<ComponentSize, ResourceInput> = {
    xs: { cpu: 300, memory: 128 },
    sm: { cpu: 300, memory: 128 },
    md: { cpu: 1000, memory: 512 },
    lg: { cpu: 300, memory: 128 },
    xl: { cpu: 300, memory: 128 },
  };

  public dotEnv?: DotEnv;
  public service: Service;
  public sentry?: SentryProject;

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

  static check(scan: SourceScanResult, source: Source) {
    return !!scan.packageJsons["."]?.dependencies["next"];
  }

  static default(scan: SourceScanResult, source: Source) {
    const packageJson = scan.packageJsons["."];

    const next = new Next({
      name: packageJson.name,
      size: "md",
    });

    return {
      url: next.publicUrl,
    };
  }

  constructor({
    name,
    size = "sm",
    buildEnv,
    buildEnvExtends = [],
    resources = Next.sizeResources[size],
    dockerfile = Next.createDockerFile(),
    context = ".",
    enableSentry = true,
    ...input
  }: NextInput) {
    let sentry: SentryProject;
    let env: any = {};

    if (enableSentry) {
      const { repository, project, branch } = getContext();
      sentry = new SentryProject(name, {
        name: `${project.name}-${repository.name}`,
        team: "frontend",
        organization: "devticon",
        platform: "javascript-nextjs",
      });
      env = {
        SENTRY_URL: "https://sentry.cloudticon.com/",
        SENTRY_ORG: sentry.organization,
        SENTRY_PROJECT: sentry.slug,
        SENTRY_AUTH_TOKEN: process.env.SENTRY_TOKEN,
        NEXT_PUBLIC_SENTRY_DSN: sentry.dsn,
        NEXT_PUBLIC_SENTRY_ENVIRONMENT: branch.name,
        SENTRY_DSN: sentry.dsn,
        SENTRY_ENVIRONMENT: branch.name,
      };
    }

    let dotEnv: DotEnv;
    if (buildEnv) {
      dotEnv = new DotEnv(`${name}/.env`, {
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
      resources,
      isDefaultService: true,
      build: {
        dockerfile,
        context,
        dependsOn: dotEnv ? [dotEnv] : [],
      },
      ...input,
    });

    this.dotEnv = dotEnv;
    this.sentry = sentry;
  }
}
