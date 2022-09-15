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
import { setupBuildx } from "./utils/setupBuildx";

export * from "./components";
export * from "./legacy/getValues";
export * from "./utils/getContext";
export * from "./legacy/interpolate";
export * from "./legacy/getRepositoryOutput";

addAlias("cloudticon", __dirname + "/index.js");

export const run = async () => {
  const cmd = core.getInput("cmd") as TerraformCmd;
  const terraformCacheKey = `${context.project}-${context.repository}-${context.branch}`;
  const dockerCacheKey = `${context.project}-${context.repository}-${context.branch}-docker`;
  const values = {
    domain: `payticon.dev2.cloudticon.com`,
  };

  await setupCreds();
  await setupBuildx();
  await setupHasuraCli();
  await setupTerraform();

  const projectBranchScope = await terraformProjectBranchScope();
  const repositoryBranchScope = await terraformRepositoryBranchScope();
  repositoryBranchScope.setVariables(values);

  await cache.restoreCache(["/opt/docker-cache"], dockerCacheKey);
  await cache.restoreCache(
    [
      projectBranchScope.getMetadataPath(),
      repositoryBranchScope.getMetadataPath(),
    ],
    terraformCacheKey
  );

  const { services, outputs } = compileAndRequire(
    `${context.workingDir}/ct`,
    repositoryBranchScope
  );
  repositoryBranchScope.setOutput(outputs);
  repositoryBranchScope.setServices(services);

  switch (cmd) {
    case "plan":
    case "apply":
      await projectBranchScope.cmd(cmd);
      await repositoryBranchScope.cmd(cmd);
      break;
    case "destroy":
      await repositoryBranchScope.cmd(cmd);
      await projectBranchScope.cmd(cmd);
      break;
  }

  await cache.saveCache(
    [
      projectBranchScope.getMetadataPath(),
      repositoryBranchScope.getMetadataPath(),
    ],
    terraformCacheKey
  );
  await cache.saveCache(["/opt/docker-cache"], dockerCacheKey);
};

run().then();
