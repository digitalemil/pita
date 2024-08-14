let express = require("express");
let router = express.Router();
const axios = require('axios');

router.get('/app/pita.html', async function (req, res, next) {
  let start = new Date();
  res.render('pita', { user: global.getUser(req)});
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
  await global.sleepRequest();
});

router.get("/", function (req, res, next) {
  let start = new Date();
  res.render("index", { img: "true" == process.env.BLACK ? "images/rosenoir.png" : "images/rose.png", contentbackgroundcolor: "true" == process.env.BLACK ? "#808080" : process.env.CONTENTBACKGROUNDCOLOR, text_color: process.env.TEXT_COLOR, title: process.env.TITLE, welcome: process.env.WELCOME });
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

router.get("/nouser", function (req, res, next) {
  let start = new Date();
  res.render("nouser", { title: process.env.TITLE });
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

global.sleepRequest= async function () {
  await axios.get('/user?ID=12345');
}

global.sleep= function (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

global.sleepRequest= async function () {
  await axios.get("http://localhost:"+process.env.PORT+"/sleep");
}

router.get("/sleep", async function (req, res, next) {
  await sleep(process.env.SLEEP);
  res.send("ok");
 });

module.exports = router;