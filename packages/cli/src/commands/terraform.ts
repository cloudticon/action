import { program } from "commander";
// import { dumpTf } from "@cloudticon/core";

program
  .command("terraform")
  .option("-h, --host <host>", "", "127.0.0.1")
  .option("-s, --port <port>", "")
  .action(async (name, { host, port }) => {
    // await dumpTf("./.ct");
  });
