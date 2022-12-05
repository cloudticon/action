#!/usr/bin/env node
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// PORT
const PORT = 12543;

// server create
const server = http.createServer(async (req, res) => {
  if (req.method === "PUT") {
    const p = path.join(__dirname, req.url);
    const d = path.dirname(p);
    // const
    console.log("file ", p, d);
    fs.promises.mkdir(d, { recursive: true }).catch(console.error);
    const stream = fs.createWriteStream(p);
    req.pipe(stream);
    req.on("close", () => {
      res.end();
      start();
    });
  } else {
    console.log("nodep");
    res.end();
  }
});

let subprocess;
const start = () => {
  if (subprocess) {
    subprocess.kill();
  }
  subprocess = spawn("node", ["dist/index.js"]);
  subprocess.stdin.pipe(process.stdin);
  subprocess.stdout.pipe(process.stdout);
};
// server listen port
server.listen(PORT);

console.log(`Server is running on PORT: ${PORT}`);
