import { program } from "commander";
import { getContext } from "../utils/getContext";
import { getService } from "../utils/getService";

program
  .command("logs")
  .option("--api-url <apiUrl>", "", "https://builder.cloudticon.com")
  .option("--service <name>", "")
  .action(async ({ name }) => {
    const { namespace } = await getContext();
    const service = await getService(name, namespace);
    await service.logs();
  });
