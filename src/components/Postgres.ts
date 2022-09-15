import { Service, ServiceInput } from "../Service";
import { Input } from "../types";
import { RandomPassword } from "../RandomPassword";

export type PostgresInput = Omit<ServiceInput, "image" | "build" | "port"> & {
  user?: Input<string>;
  database?: Input<string>;
  password?: Input<string>;
  version?: Input<string>;
  volumeSize?: string;
};
export class Postgres extends Service {
  public psqlUrl: string;

  constructor({
    user = "postgres",
    database = "postgres",
    password,
    version = "12",
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
  }
}
