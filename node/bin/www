#!/usr/bin/env node

/**
 * Module dependencies.
 */

const { forEach } = require('async');
var app = require('../app');
var debug = require('debug')('workerapp:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT);
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/*
  const { WebSocketServer } = require('ws');

  const wss = new WebSocketServer({ server });
  global.wss = wss;

  function allSessions(err, sessions) {
    console.log(sessions);

  }
  wss.on('connection', function connection(ws, req) {

    let cookies = decodeURIComponent(req.headers.cookie).split(";")
    global.logger.log("info", "Headers: "+req.headers.cookie)
    let i = 0;
    let cookie = "";
    cookies.forEach(function (c) {
      if (c.trim().startsWith("connect.sid=s:")) {
        cookie = c.trim().split(":")[1].trim().split(".")[0].trim();
      }
    })
    if (cookie != "") {
      global.sessionstore.all(allSessions)
      let session = global.sessionstore.get(cookie, function (err, session) {
        if (err != null) {
          global.logger.log("info", "Client not authenticated. Closing WS.")
          ws.close();
          return;
        }
        global.logger.log("info", "Client authenticated: " + JSON.stringify(session))
        global.logger.log("info", "Cookie: " + cookie)
      })
    }
    else {
      global.logger.log("info", "Client not authenticated. Closing WS.");
      ws.close();
      return;
    }
    global.ws = ws;
    ws.on('error', function (err) {
      global.logger.log("error", err);
    }
    );

    ws.on('message', function message(data) {
      global.logger.log("info", 'Received: %s', data);
    });
  });
*/

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
