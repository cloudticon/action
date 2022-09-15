import { map, TerraformGenerator, Variable } from "terraform-generator";
import * as exec from "@actions/exec";
import { getNamespace } from "../utils/getNamespace";
import { Input } from "../types";
import { Service } from "../Service";

export type TerraformCmd = "apply" | "destroy" | "plan";

export class Terraform extends TerraformGenerator {
  public variables: Map<string, Variable> = new Map();

  constructor(public dir: string, args?: Record<string, any>) {
    super(args);
    this.backend("s3", {
      bucket: "cloudticon",
      key: `waw/${dir}`,
      region: "eu-central-1",
    });
  }

  public async cmd(cmd: TerraformCmd) {
    switch (cmd) {
      case "apply":
        await this.apply();
        break;
      case "destroy":
        await this.destroy();
        break;
      case "plan":
        await this.plan();
        break;
      default:
        throw new Error(`undefined cmd: ${cmd}`);
    }
  }

  public async apply() {
    this.write();
    await this.init();
    await this.exec(["apply", "-auto-approve"]);
  }

  public async plan() {
    this.write();
    await this.init();
    await this.exec(["plan"]);
  }

  public async destroy() {
    this.write();
    await this.init();
    await this.exec(["destroy", "-auto-approve"]);
  }

  public async init() {
    await this.exec(["init"]);
  }

  public write() {
    super.write({ dir: this.dir, format: true });
  }

  public getMetadataPath() {
    return `${this.dir}/.terraform`;
  }

  public getVarAsArgument(name: string) {
    if (!this.variables.has(name)) {
      throw new Error(`Value ${name} not found`);
    }
    return this.variables.get(name).asArgument();
  }

  public setOutput(outputs: Record<string, Input<string>>) {
    Object.entries(outputs).forEach(([name, value]) =>
      this.output(name, {
        value: value,
      })
    );
    this.resource("kubernetes_config_map_v1", "outputs", {
      metadata: {
        name: "outputs",
        namespace: getNamespace(),
      },
      data: map(outputs),
    });
  }

  public setVariables(variables: Record<string, string>) {
    Object.entries(variables).forEach(([name, value]) =>
      this.variables.set(
        name,
        this.variable(
          name,
          {
            type: "string",
          },
          value
        )
      )
    );
  }

  public setServices(services: Service[]) {
    for (let service of services) {
      service.toTf();
    }
  }

  private async exec(args: string[]) {
    await exec.exec(`terraform`, args, {
      cwd: this.dir,
    });
  }
}
