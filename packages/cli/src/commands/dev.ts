import { program } from "commander";
import { getService } from "../utils/getService";
import { watch } from "chokidar";
import { resolve } from "path";
import { onShutdown } from "node-graceful-shutdown";
import createDebug from "debug";
import * as fs from "fs";
import { getContext } from "../utils/getContext";

const debug = createDebug("watch");
program
  .command("dev")
  .option("--api-url <apiUrl>", "", "https://builder.cloudticon.com")
  .option("--name <name>", "", "backend-functions")
  .option("--watch <watchDir>", "", "lib")
  .option("-n <namespace>", "")
  .option("--shell <shellType>", "", "ash")
  .action(async ({ apiUrl, name, watchDir, shellType, namespace }) => {
    const context = await getContext();
    const tsConfig = JSON.parse(fs.readFileSync("./tsconfig.json", "utf8"));
    const { outDir } = tsConfig.compilerOptions;
    namespace = namespace || context.namespace;
    const service = await getService(name, namespace);
    await service.devMode(outDir);
    if (!service.hasDevProcess) {
      await service.startDevProcess();
    }
    await service.logs();

    onShutdown("dev-mode", async function () {
      await service.stopLogs();
      await service.devModeOff();
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
