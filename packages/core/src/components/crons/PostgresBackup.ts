import { CronJob } from "./CronJob";
import { getNamespace } from "../../utils/getNamespace";
import { Input } from "../../types";
import { getCtCreds } from "../../utils/setupCreds";

export type PostgresBackupInput = {
  name: string;
  schedule?: Input<string>;
  psqlUrl: Input<string>;
};

export class PostgresBackup extends CronJob {
  constructor({ name, schedule = "0 22 * * *", psqlUrl }: PostgresBackupInput) {
    const creds = getCtCreds().backupS3;
    super({
      name,
      schedule,
      image: "registry.cloudticon.com/cloudticon/s3-dump-postgres",
      env: {
        PG_URL: psqlUrl,
        S3_PREFIX: `${getNamespace()}/${name}`,
        S3_ACCESS_KEY: creds.accessKey,
        S3_BUCKET: creds.bucket,
        S3_ENDPOINT: creds.endpoint,
        S3_REGION: creds.region,
        S3_SECRET: creds.secretKey,
      },
    });
  }
}
