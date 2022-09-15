import * as exec from "@actions/exec";
import { context } from "../context";

export const compileCt = () =>
  exec
    .exec(`npm run tsc ${context.workingDir}/ct.ts`, [])
    .catch((e) => console.log(e));
