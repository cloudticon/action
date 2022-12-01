import { Service, ServiceInput } from "../Service";
import { JsDockerfileBuilder } from "../Dockerfile";
import { isDockerFileExist } from "../utils/isDockerFileExist";
import { DotEnv } from "../DotEnv";
import { Input } from "../types";
import { context } from "../context";

export type RemixInput = ServiceInput & {
  name: string;
  dockerfile?: string;
  context?: string;
  enableSentry?: boolean;
  buildEnvExtends?: string[];
  buildEnv?: Record<string, string>;
};

export class Remix extends Service {
  public service: Service;
  public sentry?: any;

  public static createDockerFile() {
    const builder = new JsDockerfileBuilder();
    builder
      .from("node:16-bullseye-slim", "base")
      .from("base", "deps")
      .workdir("/app")
      .copyPackageAssets()
      .runInstall(false);
    builder
      .from("base", "production-deps")
      .workdir("/app")
      .copy("/app/node_modules", "./node_modules", "deps")
      .copyPackageAssets()
      .run("npm prune --production");
    builder
      .from("base", "build")
      .env("NODE_ENV", "production")
      .workdir("/app")
      .copy("/app/node_modules", "./node_modules", "deps")
      .copy(".", ".")
      .runBuild();
    builder
      .from("base", "release")
      .env("NODE_ENV", "production")
      .workdir("/app")
      .copy("/app/node_modules", "./node_modules", "production-deps")
      .copy("/app/build", "./build", "build")
      .copy("/app/public", "./public", "build")
      .copy("./.env* ./package.json", "./")
      .cmdStart();

    return builder.toTf(`${context.workingDir}/Dockerfile`);
  }

  constructor({
    name,
    dockerfile = isDockerFileExist() ? "Dockerfile" : Remix.createDockerFile(),
    context = ".",
    enableSentry = true,
    buildEnv,
    buildEnvExtends = [],
    ...input
  }: RemixInput) {
    let dotEnv: DotEnv;
    let env: Record<string, Input<string>> = {};

    if (buildEnv) {
      dotEnv = new DotEnv({
        name: `${name}-dotenv`,
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
        context,
        dependsOn: dotEnv ? [dotEnv.resource] : [],
      },
      ...input,
    });
  }
}
