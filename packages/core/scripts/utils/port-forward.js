const { spawn } = require("child_process");

module.exports = function portForward({
  deployment,
  portFrom,
  portTo,
  namespace,
}) {
  return new Promise((resolve, reject) => {
    console.log([
      "port-forward",
      deployment,
      `${portFrom}:${portTo}`,
      "-n",
      namespace,
    ]);
    const subProcess = spawn(
      "kubectl",
      ["port-forward", deployment, `${portFrom}:${portTo}`, "-n", namespace],
      {
        env: {
          ...process.env,
        },
      }
    );
    subProcess.stdout.on("data", (data) => {
      if (data.toString().includes("Forwarding from")) {
        console.log("port forwarded", data.toString());
        resolve(() => subProcess.kill());
      }
    });

    subProcess.stderr.on("data", (data) => {
      reject(new Error(data.toString()));
    });
  });
};
