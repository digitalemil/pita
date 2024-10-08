let express = require("express");
let router = express.Router();
const axios = require('axios');

router.get('/app/pita.html', async function (req, res, next) {
  let start = new Date();
  res.render('pita', { user: global.getUser(req)});
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

router.get("/", function (req, res, next) {
  let start = new Date();
  res.render("index", { img: "true" == globalThis.process.env.BLACK ? "images/rosenoir.png" : "images/rose.png", contentbackgroundcolor: "true" == globalThis.process.env.BLACK ? "#808080" : globalThis.process.env.CONTENTBACKGROUNDCOLOR, text_color: globalThis.process.env.TEXT_COLOR, title: globalThis.process.env.TITLE, welcome: globalThis.process.env.WELCOME });
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

router.get("/nouser", function (req, res, next) {
  let start = new Date();
  res.render("nouser", { title: globalThis.process.env.TITLE });
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
});

module.exports = router;