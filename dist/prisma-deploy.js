const prismaDeploy = require(__dirname + "/utils/port-forward");
const exec = require(__dirname + "/utils/exec");

async function main() {
  const closePortForward = await prismaDeploy({
    deployment: process.env.DEPLOYMENT,
    portFrom: process.env.PORT_FROM,
    portTo: process.env.PORT_TO,
    namespace: process.env.NAMESPACE,
  });
  await exec("yarn", ["prisma", "migrate", "deploy"]);
  closePortForward();
}
main();
