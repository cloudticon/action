import { compileAndRequire } from "./utils/compileAndRequire";

import { addAlias } from "module-alias";
import { context } from "./context";
import { setupTerraform } from "./utils/installTerraform";
import { setupCreds } from "./utils/setupCreds";
import { setupHasuraCli } from "./utils/setupHasuraCli";
import * as core from "@actions/core";
import { TerraformCmd } from "./terraform/Terraform";
import { terraformProjectBranchScope } from "./terraform/terraformProjectBranchScope";
import { terraformRepositoryBranchScope } from "./terraform/terraformRepositoryBranchScope";
import * as cache from "@actions/cache";

export * from "./components";
export * from "./legacy/getValues";
export * from "./utils/getContext";
export * from "./legacy/interpolate";
export * from "./legacy/getRepositoryOutput";

addAlias("cloudticon", __dirname + "/index.js");

export const run = async () => {
  const cmd = core.getInput("cmd") as TerraformCmd;
  const cacheKey = `${context.project}-${context.repository}-${context.branch}`;
  const values = {
    domain: `payticon.dev2.cloudticon.com`,
  };

  await setupCreds();
  await setupHasuraCli();
  await setupTerraform();

  const projectBranchScope = await terraformProjectBranchScope();
  const repositoryBranchScope = await terraformRepositoryBranchScope();
  repositoryBranchScope.setVariables(values);

  await cache.restoreCache(
    [
      projectBranchScope.getMetadataPath(),
      repositoryBranchScope.getMetadataPath(),
    ],
    cacheKey
  );

  const { services, outputs } = compileAndRequire(
    `${context.workingDir}/ct`,
    repositoryBranchScope
  );
  repositoryBranchScope.setOutput(outputs);
  repositoryBranchScope.setServices(services);

  await projectBranchScope.cmd(cmd);
  await repositoryBranchScope.cmd(cmd);

  await cache.saveCache(
    [
      projectBranchScope.getMetadataPath(),
      repositoryBranchScope.getMetadataPath(),
    ],
    cacheKey
  );
};

run().then();
