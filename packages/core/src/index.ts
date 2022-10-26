import { compileAndRequireCtFile } from "./utils/compileAndRequireCtFile";

import { addAlias } from "module-alias";
import { setupCreds } from "./utils/setupCreds";
import { terraformProjectBranchScope } from "./terraform/terraformProjectBranchScope";
import { terraformRepositoryBranchScope } from "./terraform/terraformRepositoryBranchScope";
import { context } from "./context";
import { fetchValues } from "./ctClient";
import { terraformRepository } from "./terraform/terraformRepository";

export * from "./components";
export * from "./components/Service";
export * from "./components/RandomPassword";
export * from "./legacy/getValues";
export * from "./utils/getContext";
export * from "./legacy/interpolate";
export * from "./legacy/getRepositoryOutput";
export * from "./tools";
export * from "./utils/getBackendOutput";
export * from "./utils/isMaster";

addAlias("cloudticon", __dirname + "/index.js");

export const deploy = async () => {
  const { cmd } = context;
  const values = await fetchValues();

  await setupCreds();

  const repositoryScore = await terraformRepository();
  const projectBranchScope = await terraformProjectBranchScope();
  const repositoryBranchScope = await terraformRepositoryBranchScope();
  repositoryBranchScope.setVariables(values);

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
};
