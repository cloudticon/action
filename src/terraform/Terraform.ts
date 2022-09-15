import { TerraformGenerator } from "terraform-generator";
import * as exec from "@actions/exec";

export type TerraformCmd = "apply" | "destroy" | "plan";

export class Terraform extends TerraformGenerator {
  constructor(public dir: string, args?: Record<string, any>) {
    super(args);
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

  public apply() {
    this.write();
    return this.exec(["apply", "-auto-approve"]);
  }

  public plan() {
    this.write();
    return this.exec(["plan"]);
  }

  public destroy() {
    this.write();
    return this.exec(["destroy", "-auto-approve"]);
  }

  public write() {
    super.write({ dir: this.dir, format: true });
  }

  private async exec(args: string[]) {
    await exec.exec(`terraform`, args, {
      cwd: this.dir,
    });
  }
}
