const axios = require("axios");
const fs = require("fs");
const path = require("path");

const file = "index.js";
axios
  .put(
    `http://localhost:12543/dist/${file}`,
    fs.createReadStream(`src/${file}`)
  )
  .then(() => console.log("done"));
