import * as exec from "@actions/exec";

export const runTerraform = async (args: string[]) => {
  await exec.exec(`terraform`, args);
};
