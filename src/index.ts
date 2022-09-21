import { compileAndRequireCtFile } from "./utils/compileAndRequireCtFile";

import { addAlias } from "module-alias";
import { setupTerraform } from "./utils/installTerraform";
import { setupCreds } from "./utils/setupCreds";
import { setupHasuraCli } from "./utils/setupHasuraCli";
import * as core from "@actions/core";
import { TerraformCmd } from "./terraform/Terraform";
import { terraformProjectBranchScope } from "./terraform/terraformProjectBranchScope";
import { terraformRepositoryBranchScope } from "./terraform/terraformRepositoryBranchScope";
import { setupBuildx } from "./utils/setupBuildx";
import { restoreCache, saveCache } from "./cache";
import { context } from "./context";
import { fetchValues } from "./ctClient";
import { terraformRepository } from "./terraform/terraformRepository";
import { sendNotify } from "./sendNotify";

export * from "./components";
export * from "./Service";
export * from "./legacy/getValues";
export * from "./utils/getContext";
export * from "./legacy/interpolate";
export * from "./legacy/getRepositoryOutput";
export * from "./tools";
export * from "./utils/getBackendOutput";
export * from "./utils/isMaster";

addAlias("cloudticon", __dirname + "/index.js");

export const run = async () => {
  const cmd = getCmd();
  const values = await fetchValues();

  await setupCreds();
  await setupBuildx();
  await setupHasuraCli();
  await setupTerraform();

  const repositoryScore = await terraformRepository();
  const projectBranchScope = await terraformProjectBranchScope();
  const repositoryBranchScope = await terraformRepositoryBranchScope();
  repositoryBranchScope.setVariables(values);

  if (cmd === "apply") {
    await restoreCache([
      repositoryScore,
      projectBranchScope,
      repositoryBranchScope,
    ]);
  }
  try {
    const { services, outputs } = await compileAndRequireCtFile(
      repositoryBranchScope
    );
    repositoryBranchScope.setOutput(outputs);
    repositoryBranchScope.setServices(services);

    await Promise.all([
      repositoryScore.init(),
      projectBranchScope.init(),
      repositoryBranchScope.init(),
    ]);

    switch (cmd) {
      case "plan":
      case "apply":
        await repositoryScore.cmd(cmd);
        await projectBranchScope.cmd(cmd);
        await repositoryBranchScope.cmd(cmd);
        break;
      case "destroy":
        await repositoryBranchScope.cmd(cmd);
        // await projectBranchScope.cmd(cmd);
        // await repositoryScore.cmd(cmd);
        break;
    }

    if (cmd === "apply") {
      await saveCache([
        repositoryScore,
        projectBranchScope,
        repositoryBranchScope,
      ]);
    }
    await sendNotify();
  } catch (e) {
    await sendNotify(e);
    throw e;
  }
};

const getCmd = (): TerraformCmd => {
  if (context.eventName === "delete") {
    return "destroy";
  }
  const cmd = core.getInput("cmd") as TerraformCmd;
  if (cmd) {
    return cmd;
  }
  return "apply";
};
run().then();
