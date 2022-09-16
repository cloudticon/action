import { Service, ServiceInput } from "../Service";
import { Input } from "../types";
import { Postgres } from "./Postgres";
import { BackendFunctions } from "./BackendFunctions";
import { RandomPassword } from "../RandomPassword";
import { TerraformGenerator } from "terraform-generator";
import { LocalExec } from "../LocalExec";
import * as path from "path";
import { context } from "../context";

export type HasuraInput = ServiceInput & {
  name: string;
  adminSecret?: string;
  version?: string;
  // resources?: ResourceInput;
  deploy?: boolean;
};

export class Hasura extends Service {
  public static readonly publicPrefixes = [
    "/console",
    "/v1",
    "/v2",
    "/healthz",
    "/api/rest",
  ];
  public adminSecret: Input<string>;
  public functions?: BackendFunctions;
  public postgres?: Postgres;
  public service: Service;

  get consoleUrl() {
    return `${this.publicUrl}/console`;
  }

  get publicGraphqlUrl() {
    return `${this.publicUrl}/v1/graphql`;
  }

  get publicWebsocketUrl() {
    return `${this.getPublicUrl("wss")}/v1/graphql`;
  }

  get publicVersionUrl() {
    return `${this.publicUrl}/v1/version`;
  }

  get linkGraphqlUrl() {
    return `${this.linkUrl}/v1/graphql`;
  }

  constructor({
    name,
    adminSecret,
    version = "latest",
    resources,
    customDomain,
    publicPrefixes = Hasura.publicPrefixes,
    deploy = true,
    ...input
  }: HasuraInput) {
    super({
      name,
      image: `hasura/graphql-engine:${version}`,
      port: 8080,
      resources,
      customDomain,
      publicPrefixes,
      ...input,
    });

    this.adminSecret = adminSecret
      ? adminSecret
      : new RandomPassword({
          name: `${name}-adminSecret`,
          length: 64,
          special: false,
        }).result;

    this.env("HASURA_GRAPHQL_ADMIN_SECRET", this.adminSecret);
    this.check("/healthz");
  }

  setAuthHook(url: Input<string>) {
    this.env("HASURA_GRAPHQL_AUTH_HOOK", url);
    this.env("HASURA_GRAPHQL_AUTH_HOOK_MODE", "POST");
  }

  setFunctions(functions: BackendFunctions, HACK_use_public = false) {
    this.functions = functions;
    this.link(functions);
    const url = HACK_use_public
      ? functions.publicUrl
      : `http://${functions.linkUrl}`;
    this.env("FUNCTIONS_URL", url);
    this.env("F", url);
    return this;
  }

  setPostgres(postgres: Postgres) {
    this.postgres = postgres;
    this.link(postgres);
    this.env("HASURA_GRAPHQL_DATABASE_URL", postgres.psqlUrl);
    return this;
  }

  enableConsole() {
    this.env("HASURA_GRAPHQL_ENABLE_CONSOLE", "true");
    return this;
  }

  toTf() {
    const waitForHealth = new LocalExec({
      name: `${this.name}-wait-for-health`,
      command: path.resolve("scripts/waitForHealth.sh"),
      environment: {
        URL: `${this.publicUrl}/healthz`,
        CODE: "200",
        TIME: "30",
      },
      dependsOn: [
        this.kubeDeployment,
        this.kubeIngress,
        this.functions?.kubeService,
        this.functions?.kubeDeployment,
        this.postgres?.kubeService,
        this.postgres?.kubeDeployment,
      ].filter((d) => !!d),
    });

    new LocalExec({
      name: `${this.name}-deploy`,
      command: path.resolve("scripts/hasura-deploy.sh"),
      workingDir: `${context.workingDir}/hasura`,
      environment: {
        HASURA_GRAPHQL_ENDPOINT: this.publicUrl,
        HASURA_GRAPHQL_ADMIN_SECRET: this.adminSecret,
      },
      dependsOn: [waitForHealth.resource],
    });
    return super.toTf();
  }
}
