import * as fs from "fs";

export const getPackageJson = () => {
  return JSON.parse(fs.readFileSync("package.json", "utf8"));
};
