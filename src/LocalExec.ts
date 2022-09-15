import { map, Provisioner } from "terraform-generator";
import { Input } from "./types";
import { Resource } from "terraform-generator/dist/blocks";
import { globalTerraform } from "./utils/compileAndRequire";

export type LocalExecInput = {
  name: string;
  command: string;
  workingDir?: string;
  environment?: Record<string, Input<string>>;
  dependsOn?: Resource[];
};
export class LocalExec {
  constructor(input: LocalExecInput) {
    const exec = globalTerraform.resource("null_resource", input.name, {
      triggers: map({
        time: Date.now(),
      }),
      depends_on: input.dependsOn,
    });
    exec.setProvisioners([
      new Provisioner("local-exec", {
        command: input.command,
        working_dir: input.workingDir,
        environment: input.environment ? map(input.environment) : undefined,
      }),
    ]);
  }
}
