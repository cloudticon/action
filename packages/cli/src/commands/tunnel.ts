import { program } from "commander";
import { getContext } from "../utils/getContext";
import { getKubeDeployPods } from "../kube";
import { portForwardToKubePod } from "../kube/portForwardToKubePod";
import { getKubeService } from "../kube/getKubeService";

program
  .command("tunnel <service>")
  .option("-h, --host <host>", "", "127.0.0.1")
  .option("-s, --port <port>", "")
  .action(async (name, { host, port }) => {
    const { namespace } = await getContext();
    const service = await getKubeService({ namespace, name });
    const [pod] = await getKubeDeployPods({ namespace, name });
    const podPort = service.spec.ports[0].port;
    const localPort = port || podPort;

    await portForwardToKubePod({
      namespace,
      pod: pod.metadata.name,
      podPort,
      localPort,
      host,
    });

    console.log(`tunnel open on ${host}:${localPort}`);
  });
