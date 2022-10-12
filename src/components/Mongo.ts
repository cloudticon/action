import { Service, ServiceInput } from "../Service";
import { Input } from "../types";
import { RandomPassword } from "../RandomPassword";
import { MongoBackup } from "./crons";

export type MongoInput = Omit<ServiceInput, "image" | "build" | "port"> & {
  user?: Input<string>;
  password?: Input<string>;
  version?: Input<string>;
  volumeSize?: Input<string>;
};

export class Mongo extends Service {
  public mongoUrl: string;

  constructor({
    name,
    version = "6.0.2",
    user = "admin",
    password = new RandomPassword({
      name: `${name}-password`,
      special: false,
    }).result,
    volumeSize = "6Gi",
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

    this.mongoUrl = `mongodb://${user}:${password}@${name}:27017`;
    new MongoBackup({
      name: `${name}-backup`,
      mongoUrl: this.mongoUrl,
    });
  }
}
