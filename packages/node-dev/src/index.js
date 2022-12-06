#!/usr/bin/env node
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = 12543;
let subprocess;

const index = http.createServer(async (req, res) => {
  switch (true) {
    case req.method === "PUT":
      const p = path.join(process.cwd(), req.url);
      const d = path.dirname(p);
      fs.promises.mkdir(d, { recursive: true }).catch(console.error);
      const stream = fs.createWriteStream(p);
      req.pipe(stream);
      req.on("close", () => {
        res.end();
      });
      break;
    case req.method === "DELETE":
      await fs.promises.rm(path.join(process.cwd(), req.url));
      res.end();
      break;
    case req.method === "POST" && req.url === "/restart":
      if (subprocess) {
        subprocess.kill();
      }
      subprocess = spawn("yarn", ["start"], {
        cwd: process.cwd(),
      });
      subprocess.stdout.pipe(process.stdout);
      subprocess.stderr.pipe(process.stderr);
      res.end();
      break;
    case req.method === "GET" && req.url === "/health":
      res.end();
      break;
    default:
      res.writeHead(404);
      res.end();
  }
});
index.listen(PORT);
