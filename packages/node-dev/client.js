require("esbuild")
  .build({
    entryPoints: [
      "/home/krs/Projects/cloudticon/deploy/packages/node-dev/src/index.ts",
    ],
    outfile: "out.js",
    bundle: true,
    watch: {
      onRebuild(error, result) {
        if (error) console.error("watch build failed:", error);
        else {
          console.log("watch build succeeded:", result);
          // HERE: somehow restart the server from here, e.g., by sending a signal that you trap and react to inside the server.
        }
      },
    },
  })
  .then((result) => {
    console.log("watching...");
  });
