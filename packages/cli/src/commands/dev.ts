import { program } from "commander";
import { getService } from "../utils/getService";
import { watch } from "chokidar";
import { resolve } from "path";
import { onShutdown } from "node-graceful-shutdown";
import createDebug from "debug";
import * as fs from "fs";
import { getContext } from "../utils/getContext";
import { spinner } from "../utils/spinner";
import { Debouncer } from "../utils/Debouncer";
import { git } from "../utils/git";

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
    const diff = await git.diff(context.branch);

    onShutdown("dev-mode", async function () {
      await service.stopLogs();
      spinner.start({ text: "Closing dev mode" });
      await service.devMode.stop();
      spinner.clear();
      spinner.reset();
    });

    spinner.start({ text: "Starting dev mode" });
    await service.devMode.start();

    if (!diff.length) {
      await service.devMode.restartServer();
      spinner.success();
      await service.logs();
    }

    const debouncer = new Debouncer(100, async () => {
      await service.devMode.restartServer();
      spinner.success();
      await service.logs();
    });

    diff.forEach((file) => {
      debouncer.add(service.devMode.copyFile(resolve(file), file));
    });

    watch(outDir)
      .add("node_modules")
      .on("change", (name) => {
        debug(`file changed ${name}`);
        if (name.endsWith(".js")) {
          debouncer.add(service.devMode.copyFile(resolve(name), name));
          spinner.start({
            text: `Restating server, files ${debouncer.promises.length} changed`,
          });
        }
      })
      .on("unlink", (name) => {
        debouncer.add(service.devMode.rmFile(name));
        spinner.start({
          text: `Restating server, files ${debouncer.promises.length} removed`,
        });
      });
  });
