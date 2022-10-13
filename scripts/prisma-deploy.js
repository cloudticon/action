const portForward = require(__dirname + "/utils/port-forward");
const exec = require(__dirname + "/utils/exec");

async function main() {
  await portForward();
  exec("yarn", ["prisma", "migrate", "deploy"], {
    cwd: "/home/krs/Projects/payticon/frontend-eshop",
    env: {
      DATABASE_URL:
        "postgresql://postgres:wzWElvwxAwCtgI1Qn7zrcG9H63tVL83q@localhost:5432/postgres?schema=public",
    },
  });
}
main();
