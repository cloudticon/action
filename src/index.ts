import { generateServices, tfg } from "./tfg";
import * as path from "path";
import { context } from "./context";
import * as process from "process";
export * from "./components";
export * from "./utils/getValues";
export * from "./utils/getContext";
export * from "./utils/interpolate";
export * from "./utils/getRepositoryOutput";

import * as core from "@actions/core";
require("module-alias/register");
require("ts-node").register({
  lazy: true,
});

async function run(): Promise<void> {
  try {
    require(`${context.workingDir}/ct.ts`);
    core.setOutput("time", new Date().toTimeString());
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
