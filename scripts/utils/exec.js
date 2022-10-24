const { spawn } = require("child_process");

module.exports = function (cmd, args, options) {
  return new Promise((resolve, reject) => {
    const subprocess = spawn(cmd, args, options);
    subprocess.stdout.pipe(process.stdout);
    subprocess.stderr.pipe(process.stderr);
    subprocess.on("close", (code) => {
      if (code) {
        reject(new Error(`Process code: ${code}`));
      } else {
        resolve();
      }
    });
  });
};
