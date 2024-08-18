let express = require("express");
let router = express.Router();
const axios = require('axios');

router.get('/app/pita.html', async function (req, res, next) {
  let start = new Date();
  res.render('pita', { user: global.getUser(req)});
  global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);

    setTimeout(global.sleepRequest, 10);
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

global.sleep= function (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
getNodeAutoInstrumentations({
  '@opentelemetry/instrumentation-http': {
    startIncomingSpanHook: (req) => {
      delete req.headers.traceparent;
      delete req.headers[`x-cloud-trace-context`];
      delete req.headers[`grpc-trace-bin`];
      console.log("Cloud Run Traceremoval.");
      return {};
    },
  },
});
/*

const api = require('@opentelemetry/api');
const { B3Propagator, B3InjectEncoding } = require('@opentelemetry/propagator-b3');

api.propagation.setGlobalPropagator(
  new B3Propagator({ injectEncoding: B3InjectEncoding.MULTI_HEADER })
);

const { B3Propagator } = require('@opentelemetry/propagator-b3');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');

const tracerProvider = new NodeTracerProvider();

tracerProvider.register({
  propagator: new B3Propagator(),
});
*/
global.sleepRequest= async function () {
  
  await axios.get(process.env.SLEEPURL);
}

router.get("/sleep", async function (req, res, next) {
  console.log("Headers: "+req.headers)
  delete req.headers.traceparent;
  await sleep(process.env.SLEEP);
  res.send("ok");
 });

module.exports = router;