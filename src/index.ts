import { compileAndRequire } from "./utils/compileAndRequire";
import { ModuleKind, ScriptTarget } from "typescript";

import { addAlias } from "module-alias";
import { context } from "./context";
import { generateServices } from "./tfg";
import { setupTerraform } from "./utils/installTerraform";

export * from "./components";
export * from "./utils/getValues";
export * from "./utils/getContext";
export * from "./utils/interpolate";
export * from "./utils/getRepositoryOutput";

addAlias("cloudticon", __dirname + "/index.js");

export const run = async () => {
  await setupTerraform();
  compileAndRequire(`${context.workingDir}/ct`, {
    noEmitOnError: false,
    noImplicitAny: true,
    target: ScriptTarget.ES5,
    module: ModuleKind.CommonJS,
  });
  generateServices();
};

run();
