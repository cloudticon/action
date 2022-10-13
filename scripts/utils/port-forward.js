const { spawn } = require("child_process");

module.exports = function portForward() {
  return new Promise((resolve, reject) => {
    const subProcess = spawn(
      "kubectl",
      [
        "port-forward",
        "statefulset/postgres",
        "5432:5432",
        "-n",
        "payticon-3-development",
      ],
      {}
    );

    subProcess.stdout.on("data", (data) => {
      if (data.toString().includes("Forwarding from")) {
        resolve(() => subProcess.kill());
      }
    });

    subProcess.stderr.on("data", (data) => {
      reject(new Element(data.toString()));
    });
  });
};
