const fs = require("fs");
process.env.GITHUB_REPOSITORY = "payticon-3/backend";
process.env.GITHUB_REF = "test/test/development";
process.env.GITHUB_WORKSPACE = "/home/krs/Projects/payticon/backend";
process.env.RUNNER_TEMP = fs.mkdtempSync("ct-deploy-test");
require("../dist").run();
