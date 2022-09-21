import { Service, ServiceInput } from "../Service";
import { Input } from "../types";
import { BuildableJsDockerfileBuilder } from "../Dockerfile";
import { Hasura } from "./Hasura";
import { Postgres } from "./Postgres";
import { LocalFile } from "../LocalFile";
import * as fs from "fs";
import { isDockerFileExist } from "../utils/isDockerFileExist";
import { context } from "../context";

export type BackendFunctionsInput = ServiceInput & {
  extendsConfig?: boolean;
  config?: Record<string, Input<any>>;
};

export class BackendFunctions extends Service {
  public static createDockerFile() {
    return new (class extends BuildableJsDockerfileBuilder {
      beforeBuild(builder) {
        builder.run("mkdir -p var");
      }
      release(builder) {
        builder
          .from("base", "release")
          .workdir("/app")
          .env("NODE_ENV", "production")
          .copy("/app/prod_node_modules", "./node_modules", "dependencies")
          .copy("/app/package.json", "./package.json", "builder")
          .copy("/app/var", "./var", "builder")
          .copy("/app/lib", "./lib", "builder")
          .copy(".functions-config.json", "./.functions-config.json")
          .cmdStart();
      }
    })().build();
  }

  public configFile?: LocalFile;

  constructor({
    extendsConfig = true,
    config,
    build = {
      context: ".",
      dockerfile: isDockerFileExist()
        ? "Dockerfile"
        : BackendFunctions.createDockerFile(),
    },
    port = 8080,
    checks = {
      path: "/heatlh-live",
    },
    ...containerInput
  }: BackendFunctionsInput) {
    super({ ...containerInput, build, port });
    if (config) {
      this.config(config, extendsConfig);
    }
  }

  public setHasura(hasura: Hasura) {
    this.link(hasura)
      .env("HASURA_GRAPHQL_URL", hasura.linkGraphqlUrl)
      .env("HASURA_GRAPHQL_ADMIN_SECRET", hasura.adminSecret);
    return this;
  }

  public setPostgres(postgres: Postgres) {
    this.link(postgres).env("DATABASE_URL", postgres.psqlUrl);
    return this;
  }

  public config(config: Record<string, Input<any>>, extendsConfig = true) {
    const content = BackendFunctions.getConfigContent(config, extendsConfig);
    this.configFile = new LocalFile({
      name: `${this.name}-config-file`,
      filename: `${context.workingDir}/.functions-config.json`,
      content,
    });

    this.dockerImage.addBuildDependsOn(this.configFile.resource);
  }

  private static getConfigContent(
    config: Record<string, Input<any>>,
    extendsConfig: boolean
  ) {
    let configObject = {};

    if (extendsConfig) {
      configObject = JSON.parse(
        fs.readFileSync(".functions-config.json", "utf8")
      );
    }

    configObject = {
      ...configObject,
      ...config,
    };

    return JSON.stringify(configObject, null, 2);
  }
}
