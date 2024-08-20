let winston = require('winston');
expressWinston = require('express-winston');

Date.prototype.timeNow = function () {
  return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}

const wlogger = winston.createLogger({
  levels: {
    'info': 1,
    'error': 0,
    'warn': 2
  },
  format: winston.format.simple(),
  defaultMeta: {},
  transports: [
    new winston.transports.File({ filename: process.env.LOGFOLDER + '/error.log', level: 'error' }),
    new winston.transports.File({ filename: process.env.LOGFOLDER + '/combined.log' }),
    new winston.transports.Console({format: winston.format.simple()})
  ],
});
const loggermw = expressWinston.logger({
  winstonInstance: wlogger,
  statusLevels: true,
  meta: true, // optional: control whether you want to log the meta data about the request (default to true)
  msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
  expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
  colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
  ignoreRoute: function (req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
})
global.logger = wlogger;
wlogger.log("info", "Starting on port: 3333");
app.use(loggermw);

wlogger.log("info", "Environment= " + process.env.ENV)

const prom_client = require('prom-client');
const defaultLabels = { component: 'appserver', app: process.env.APP };
const register = prom_client.register;
register.setDefaultLabels(defaultLabels);

prom_client.collectDefaultMetrics({ register });
app.get('/_status/vars', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});
global.httpRequestDurationMilliseconds = new prom_client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['route', 'status', 'method'],
  buckets: [0.05, 0.1, 0.5, 1, 2, 4, 8, 16, 64]
})

global.sqlQueries= new prom_client.Counter(
  {
    name: 'sql_queries_count',
    help: 'Number of SQL Queries',
    labelNames: ['query']
  }
);
global.sqlUpdates= new prom_client.Counter(
  {
    name: 'sql_updates_count',
    help: 'Number of Updates',
    labelNames: ['updates']
  }
);
global.sqlInserts= new prom_client.Counter(
  {
    name: 'sql_inserts_count',
    help: 'Number of Inserts',
    labelNames: ['inserts']
  }
);
global.sqlDeletes= new prom_client.Counter(
  {
    name: 'sql_deletes_count',
    help: 'Number of Deletes',
    labelNames: ['deletes']
  }
);
global.sqlSelects= new prom_client.Counter(
  {
    name: 'sql_selects_count',
    help: 'Number of Selects',
    labelNames: ['selects']
  }
);
global.sqlErrors= new prom_client.Counter(
  {
    name: 'sql_errors_count',
    help: 'Number of DB Errors',
    labelNames: ['errors']
  }
);
global.sqlRetries= new prom_client.Counter(
  {
    name: 'sql_retries_count',
    help: 'Number of Retries',
    labelNames: ['retries']
  }
);
global.sqlUpserts= new prom_client.Counter(
  {
    name: 'sql_upserts_count',
    help: 'Number of Upserts',
    labelNames: ['upserts']
  }
);
global.sqlCreates= new prom_client.Counter(
  {
    name: 'sql_creates_count',
    help: 'Number of Creates',
    labelNames: ['creates']
  }
);
global.sqlTransactions= new prom_client.Counter(
  {
    name: 'sql_transactions_count',
    help: 'Number of Transactions',
    labelNames: ['transactions']
  }
);
global.sqlCommits= new prom_client.Counter(
  {
    name: 'sql_commits_count',
    help: 'Number of Commits',
    labelNames: ['transactions']
  }
);
global.sqlRollbacks= new prom_client.Counter(
  {
    name: 'sql_rollbacks_count',
    help: 'Number of Rollbacks',
    labelNames: ['transactions']
  }
);
global.sqlIsUp= new prom_client.Gauge({
  name: 'sql_isup',
  help: '1 DBMS is available, 0 unavailable',
  labelNames: ['isup']
})

global.sqlQueryDurationMilliseconds = new prom_client.Histogram({
  name: 'sql_query_duration_ms',
  help: 'Duration of SQL queries in ms',
  labelNames: ['query'],
  buckets: [1, 4, 8, 16, 32, 128, 256, 512, 1024]
})

Date.prototype.timeNow = function () {
  return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}

module.exports.loggger = logger;
