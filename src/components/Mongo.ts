import { Service, ServiceInput } from "../Service";
import { Input } from "../types";
import { RandomPassword } from "../RandomPassword";
import { MongoBackup } from "./crons";

export type MongoInput = Omit<ServiceInput, "image" | "build" | "port"> & {
  user?: Input<string>;
  password?: Input<string>;
  version?: Input<string>;
  database?: Input<string>;
  volumeSize?: Input<string>;
};

export class Mongo extends Service {
  public user: Input<string>;
  public password: Input<string>;
  public database: Input<string>;

  get mongoUrl() {
    return `mongodb://${this.user}:${this.password}@${this.name}:27017/${this.database}?authSource=admin&retryWrites=true&w=majority`;
  }

  constructor({
    name,
    version = "6.0.2",
    user = "admin",
    password = new RandomPassword({
      name: `${name}-password`,
      special: false,
    }).result,
    volumeSize = "6Gi",
    database = "db",
    ...input
  }: MongoInput) {
    super({
      ...input,
      name: name,
      port: 27017,
      image: `mongo:${version}`,
      env: {
        MONGO_INITDB_ROOT_USERNAME: user,
        MONGO_INITDB_ROOT_PASSWORD: password,
        ...(input.env || {}),
      },
      volumes: [
        {
          name: `${name}-data`,
          path: "/data/db",
          size: volumeSize,
        },
        ...(input.volumes || []),
      ],
    });
    this.user = user;
    this.password = password;
    this.database = database;

    new MongoBackup({
      name: `${name}-backup`,
      mongoUrl: this.mongoUrl,
    });
  }
}
