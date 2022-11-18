import { initKubeClient } from "./initKubeClient";
import { Exec, V1Status } from "@kubernetes/client-node";
import { PassThrough, Readable, Stream, Writable } from "stream";
import EventEmitter from "events";
import WebSocket = require("isomorphic-ws");
import { kubeDebug } from "./kubeDebug";
import { machine } from "os";

// export type ExecKubeProcess = {
//   stdout: Writable;
//   stderr: Writable;
//   stdin: Readable;
// };
export class ExecKubeProcess extends EventEmitter {
  stdout = new PassThrough();
  stderr = new PassThrough();
  stdin = new PassThrough();
  ws: WebSocket;

  close() {
    this.ws.close();
  }
}
type ExecKubePodProps = {
  namespace: string;
  name: string;
  container: string;
  command: string;
};
export const execKubePod = async ({
  name,
  namespace,
  container,
  command,
}: ExecKubePodProps) => {
  const { config } = await initKubeClient();
  const subProcess = new ExecKubeProcess();
  const exec = new Exec(config);
  kubeDebug("exec pod", namespace, name, container, command);
  exec
    .exec(
      namespace,
      name,
      container,
      command,
      subProcess.stdout as Writable,
      subProcess.stderr as Writable,
      subProcess.stdin as any as Readable,
      true,
      (status: V1Status) => subProcess.emit("close", status)
    )
    .then((ws) => (subProcess.ws = ws));
  return subProcess as ExecKubeProcess;
};
