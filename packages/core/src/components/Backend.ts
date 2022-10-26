import { Hasura, HasuraInput } from "./Hasura";
import { Postgres, PostgresInput } from "./Postgres";
import { BackendFunctions, BackendFunctionsInput } from "./BackendFunctions";
import { Input } from "../types";

export type BackendInput = {
  name: string;
  hasura?: Omit<HasuraInput, "name">;
  postgres?: Omit<PostgresInput, "name">;
  functions?: Omit<BackendFunctionsInput, "name">;
  size?: any;
  enableSentry?: boolean;
  customDomain?: Input<string>;
  HACK_use_public_url_for_functions?: boolean;
};

export class Backend {
  public postgres: Postgres;
  public hasura: Hasura;
  public functions: BackendFunctions;
  public sentry?: any;

  constructor({
    name,
    hasura,
    postgres,
    functions,
    size,
    customDomain,
    enableSentry = true,
    HACK_use_public_url_for_functions = false,
  }: BackendInput) {
    this.postgres = new Postgres({
      name: `${name}-postgres`,
      ...postgres,
    });
    this.hasura = new Hasura({
      name: `${name}-hasura`,
      customDomain,
      ...hasura,
    });
    this.functions = new BackendFunctions({
      name: `${name}-functions`,
      isDefaultService: true,
      customDomain,
      ...functions,
    });

    this.hasura
      .setPostgres(this.postgres)
      .setFunctions(this.functions, HACK_use_public_url_for_functions)
      .enableConsole();

    this.functions.setHasura(this.hasura).setPostgres(this.postgres);

    // if (enableSentry) {
    //   const { repository, project } = getContext();
    //   this.sentry = new SentryProject(name, {
    //     name: `${project.name}-${repository.name}`,
    //     team: "backend",
    //     organization: "devticon",
    //     platform: "node",
    //   });
    //   this.functions.setSentry(this.sentry);
    // }
  }
}
