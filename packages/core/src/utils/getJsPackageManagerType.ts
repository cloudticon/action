import * as fs from "fs";

export const getJsPackageManagerType = (): "npm" | "yarn" | "pnpm" => {
  if (fs.existsSync("pnpm-lock.yaml")) {
    return "pnpm";
  }
  if (fs.existsSync("yarn.lock")) {
    return "yarn";
  }
  return "npm";
};
