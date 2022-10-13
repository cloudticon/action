const { spawn } = require("child_process");

module.exports = function portForward({
  deployment,
  portForm,
  portTo,
  namespace,
}) {
  return new Promise((resolve, reject) => {
    const subProcess = spawn(
      "kubectl",
      ["port-forward", deployment, `${portForm}:${portTo}`, "-n", namespace],
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
