import { spawn } from "child_process";

const runGit = (args: string[]) => {
  return new Promise<string>((resolve, reject) => {
    const process = spawn("git", args);
    let output = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });
    process.on("close", function (code) {
      resolve(output);
    });
    process.on("error", function (err) {
      reject(err);
    });
  });
};

export const git = {
  diff: async (branch: string) => {
    const plain = await runGit(["diff", "--name-only", `origin/${branch}`]);
    return plain
      .toString()
      .split("\n")
      .filter((v) => v)
      .map((v) => v.replace("src", "lib").replace(".ts", ".js"));
  },
};
