import { Service, ServiceInput } from "./Service";
import { Input } from "../types";
import { RandomPassword } from "./RandomPassword";
import { CronJob } from "./crons/CronJob";
import { getCtCreds } from "../utils/setupCreds";
import { getNamespace } from "../utils/getNamespace";
import { PostgresBackup } from "./crons";

export type PostgresInput = Omit<ServiceInput, "image" | "build" | "port"> & {
  user?: Input<string>;
  database?: Input<string>;
  password?: Input<string>;
  version?: Input<string>;
  volumeSize?: string;
};
export class Postgres extends Service {
  public psqlUrl: string;
  public user: Input<string>;
  public password: Input<string>;
  public database: Input<string>;

  constructor({
    user = "postgres",
    database = "postgres",
    password,
    version = "14",
    volumeSize = "10Gi",
    ...input
  }: PostgresInput) {
    if (!password) {
      password = new RandomPassword({
        name: `${input.name}-password`,
        special: false,
      }).result;
    }
    super({
      ...input,
      port: 5432,
      image: `postgres:${version}`,
      env: {
        POSTGRES_DB: database,
        POSTGRES_USER: user,
        POSTGRES_PASSWORD: password,
        PGDATA: "/lib/postgresql/data/pgdata",
      },
      volumes: [
        {
          name: "data",
          path: "/lib/postgresql/data",
          size: volumeSize,
        },
      ],
    });

    this.psqlUrl = `postgres://${user}:${password}@${input.name}:5432/${database}`;
    this.user = user;
    this.password = password;
    this.database = database;

    new PostgresBackup({
      name: `${this.name}-backup`,
      psqlUrl: this.psqlUrl,
    });
  }
}
