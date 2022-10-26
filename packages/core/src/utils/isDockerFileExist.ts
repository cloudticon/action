import * as fs from "fs";
import { context } from "../context";

export const isDockerFileExist = () =>
  fs.existsSync(`${context.workingDir}/Dockerfile`);
