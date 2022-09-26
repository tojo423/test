const express = require("express");
const app = express();
const axios = require("axios").default;
const fs = require("fs");
const path = require("path");

app.use(require("cors")());

/*
  chunk requests are redirected to this endpoint by the extension

  we respond with a modified version of the javascript with our hack
*/
app.get("/chunk", (req, res) => {
  const js = fs.readFileSync(path.join(__dirname, "/chunk.js"));
  const supp = fs.readFileSync(path.join(__dirname, "/supp.js"));
  const code = js + " " + supp;
  res.send(code);
});

/*
  main chunk requests are redirected to this endpoint by the extension

  we respond with a modified version of the javascript with our hack
*/
app.get("/mainChunk", (req, res) => {
  const js = fs.readFileSync(path.join(__dirname, "/main.chunk.js"));
  res.send(js);
});

const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log(`Server started on 3000`);
});
