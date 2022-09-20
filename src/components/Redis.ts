import { Container, ContainerInput } from "./";
import { Input } from "../../../types";
import { interpolate } from "../../../utils";

export type RedisInput = Omit<ContainerInput, "build" | "image"> &
  Input<{
    version?: string;
  }>;

export class Redis extends Container {
  public get redisLinkUrl() {
    return interpolate`redis://${this.linkUrl}`;
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
