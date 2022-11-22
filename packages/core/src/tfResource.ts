import { Attribute, Block, TerraformGenerator } from "terraform-generator";
import arguments_1 from "terraform-generator/dist/arguments";
import { Resource } from "terraform-generator/dist/blocks";

const get = require("lodash.get");
const set = require("lodash.set");

export class TfResource<T = any> {
  public resource: Resource;

  constructor(
    public tf: TerraformGenerator,
    public type,
    public id: string,
    public data: any
  ) {
    this.createTf();
  }

  attr(name: string) {
    return new Attribute(new Resource(this.type, this.id, this.data), name);
  }

  get(path: string) {
    return get(this.data, path);
  }

  set(path: string, value: string) {
    set(this.data, path, value);
    this.createTf();
  }

  createTf() {
    this.resource = this.tf.resource(this.type, this.id, this.data);
    return this;
  }
}

export const resource = <T extends object>(
  tf: TerraformGenerator,
  type: string,
  id: string,
  data: T
) => {
  return new TfResource(tf, type, id, data);
};
