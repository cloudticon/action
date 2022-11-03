import { spawn } from "child_process";
import createDebug from "debug";

const debug = createDebug("kubectl");
export const kubectlStream = (args: string[], options = {}) => {
  debug(`kubectl ${args.join(" ")}`);
  return spawn(`kubectl`, args, {
    env: {
      KUBECONFIG: "/home/krs/.kube/ct-waw",
      ...process.env,
    },
    ...options,
  });
};
export const kubectl = (args: string[]) => {
  const cmd = kubectlStream(args);
  let stdoutBuffer = "";
  let stderrBuffer = "";

  cmd.stdout.on("data", (data) => {
    stdoutBuffer += data;
  });

  cmd.stderr.on("data", (data) => {
    stderrBuffer += data;
  });

  return new Promise<string>((resolve, reject) => {
    cmd.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderrBuffer));
      } else {
        resolve(stdoutBuffer);
      }
    });
  });
};

export const kubectlJson = async (args: string[]) => {
  const raw = await kubectl(args);
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.log(raw);
    throw e;
  }
};
