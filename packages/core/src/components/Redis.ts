import { Service, ServiceInput } from "./Service";
import { Input } from "../types";

export type RedisInput = Omit<ServiceInput, "build" | "image"> & {
  version?: Input<string>;
};

export class Redis extends Service {
  public get redisLinkUrl() {
    return `redis://${this.linkUrl}`;
  }

  constructor({ name, version = "latest", ...input }: RedisInput) {
    super({
      ...input,
      name,
      port: 6379,
      image: `redis:${version}`,
    });
  }
}
