import { CronJob } from "../../CronJob";
import { getNamespace } from "../../utils/getNamespace";
import { Input } from "../../types";
import { getCtCreds } from "../../utils/setupCreds";

export type MongoBackupInput = {
  name: string;
  schedule?: Input<string>;
  mongoUrl: Input<string>;
};

export class MongoBackup extends CronJob {
  constructor({ name, schedule = "0 22 * * *", mongoUrl }: MongoBackupInput) {
    const creds = getCtCreds().backupS3;
    super({
      name,
      schedule,
      image: "registry.cloudticon.com/cloudticon/s3-dump-mongo",
      env: {
        MONGO_URL: mongoUrl,
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
