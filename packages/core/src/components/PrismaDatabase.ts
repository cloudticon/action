import { Postgres } from "./Postgres";
import { LocalExec } from "./LocalExec";
import * as path from "path";
import { context } from "../context";
import { getNamespace } from "../utils/getNamespace";

type PrismaDatabaseComponent = Postgres;

type PrismaDatabaseInput = {
  name: string;
  database?: PrismaDatabaseComponent;
};
export class PrismaDatabase {
  database: PrismaDatabaseComponent;

  constructor({ name, database }: PrismaDatabaseInput) {
    this.database = database || this.addDatabase();

    const scriptPath = path.resolve("scripts/prisma-deploy.js");
    new LocalExec({
      name: `${name}-deploy`,
      command: `node ${scriptPath}`,
      workingDir: context.workingDir,
      environment: {
        DEPLOYMENT: `statefulset/${this.database.name}`,
        PORT_FROM: this.database.port.toString(),
        PORT_TO: this.database.port.toString(),
        NAMESPACE: getNamespace(),
        DATABASE_URL: this.getDbUrl(),
      },
      dependsOn: [this.database.kubeDeployment],
    });
  }

  private addDatabase(): PrismaDatabaseComponent {
    throw new Error("Prisma create database is not implemented right now");
  }

  private getDbUrl() {
    return `postgres://${this.database.user}:${this.database.password}@127.0.0.1:5432/${this.database.database}`;
  }
}
