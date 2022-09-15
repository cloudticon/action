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
import { compileCt } from "./utils/compileCt";
import * as fs from "fs";

async function run(): Promise<void> {
  try {
    await compileCt();
    console.log(fs.readFileSync(context.workingDir));
    core.setOutput("time", new Date().toTimeString());
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
