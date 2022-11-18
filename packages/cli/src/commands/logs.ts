import { program } from "commander";
import { getGitInfo } from "../utils/gitInfo";
import { getKubePods } from "../kube/getKubePods";
import { getContext } from "../utils/getContext";
import { getKubePodLogsStream } from "../kube/getKubePodLogsStream";
program
  .command("logs")
  .option("--api-url <apiUrl>", "", "https://builder.cloudticon.com")
  .option("--service <service>", "")
  .action(getLogs);

type GetLogsParams = {
  service: string;
};
export async function getLogs({ service }: GetLogsParams) {
  const { namespace } = await getContext();
  const pods = await getKubePods({ namespace });

  await getKubePodLogsStream({
    namespace,
    pod: pods[0].metadata.name,
    container: pods[0].spec.containers[0].name,
  });
  console.log(pods);
}
