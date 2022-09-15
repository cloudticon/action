import * as exec from "@actions/exec";
import { context } from "../context";

export const compileCt = () =>
  exec
    .exec(`npm run tsc ct.ts`, [], {
      cwd: context.workingDir,
    })
    .catch((e) => console.log(e));
