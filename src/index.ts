import { compileAndRequire } from "./utils/compileAndRequire";
import { ModuleKind, ScriptTarget } from "typescript";

import { addAlias } from "module-alias";
import { context } from "./context";
import { generateOutputs, generateServices, writeTf } from "./tfg";
import { setupTerraform } from "./utils/installTerraform";
import { runTerraform } from "./utils/runTerraform";
import { setupCreds } from "./utils/setupCreds";
import { setupHasuraCli } from "./utils/setupHasuraCli";

export * from "./components";
export * from "./utils/getValues";
export * from "./utils/getContext";
export * from "./utils/interpolate";
export * from "./utils/getRepositoryOutput";

addAlias("cloudticon", __dirname + "/index.js");

export const run = async () => {
  await setupHasuraCli();
  await setupCreds();
  await setupTerraform();
  const outputs = compileAndRequire(`${context.workingDir}/ct`);
  generateOutputs(outputs);
  generateServices();
  writeTf();
  await runTerraform(["init"]);
  await runTerraform(["apply", "-auto-approve"]);
};

run();
