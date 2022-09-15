import { tfg } from "./tfg";
import { Resource } from "terraform-generator/dist/blocks";
import { fn } from "terraform-generator";

export type RandomPasswordInput = {
  name: string;
  length?: number;
  special?: boolean;
};
export class RandomPassword {
  private resource: Resource;

  get result() {
    return fn("nonsensitive", this.resource.attr("result"));
  }

  constructor({ name, length = 32, special }: RandomPasswordInput) {
    this.resource = tfg.resource("random_password", name, {
      length,
      special,
    });
  }
}
