import { program } from "commander";
import { getGitInfo } from "../utils/gitInfo";
import { getService } from "../utils/getService";
import { watch } from "chokidar";
import { resolve } from "path";
import { kubectlStream } from "../utils/kubectl";
import { onShutdown } from "node-graceful-shutdown";
import createDebug from "debug";
import * as fs from "fs";

const debug = createDebug("watch");
program
  .command("dev")
  .option("--api-url <apiUrl>", "", "https://builder.cloudticon.com")
  .option("--name <name>", "", "backend-functions")
  .option("--watch <watchDir>", "", "lib")
  .option("-n <namespace>", "")
  .option("--shell <shellType>", "", "ash")
  .action(async ({ apiUrl, name, watchDir, shellType, namespace }) => {
    const tsConfig = JSON.parse(fs.readFileSync("./tsconfig.json", "utf8"));
    const { outDir } = tsConfig.compilerOptions;
    namespace = namespace || (await getGitInfo()).namespace;
    const service = await getService(name, namespace);
    await service.devMode(outDir);
    if (!service.hasDevProcess) {
      await service.startDevProcess();
    }
    await service.logs();

    onShutdown("dev-mode", async function () {
      await service.devModeOff();
    });

    process.stdin.on("data", async (data) => {
      const cmd = data.toString().replace("\n", "");

      if (cmd.startsWith("/")) {
        service.stopProcess();
        switch (cmd) {
          case "/dev-mode":
            await service.devMode(outDir);
            break;
          case "/dev-mode-off":
            await service.devModeOff();
            break;
          case "/logs":
            await service.logs();
            break;
          case "/logs-off":
            break;
          case "/shell":
            service.shell();
            break;
        }
      }
    });

    const watcher = watch(outDir).add("node_modules");
    watcher.on("change", async (name) => {
      debug(`file changed ${name}`);
      if (name.endsWith(".js")) {
        service.copyFile(resolve(name), `/app/${name}`);
      }
    });
    watcher.on("unlink", (name) => {
      service.rm(`/app/${name}`);
    });
  });

async function logs(pod: string, namespace: string) {
  const subProcess = kubectlStream(["logs", "-f", pod, "-n", namespace]);
  subProcess.stdout.pipe(process.stdout);
  subProcess.stderr.pipe(process.stderr);
}
