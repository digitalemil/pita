let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let cookieParser = require('cookie-parser');
const axios = require("axios");
let url  = require('url');
let http = require('http');
let fs = require('fs');

let bodyParser = require('body-parser');
app= global.app = express();

require("./private/o11y");

const { executeSQL } = require("./private/persistence.js");

const session = require('express-session');
const { setupSession, setupIndexForAuth, authRequired} = require("./private/signinwithgoogle.js");

// Prepare sessions for Sign In With Google unless we run local
if(! (process.env.ENV==="local")) {
  setupSession(app, session);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.text({ type: '*/*' }));
app.use(bodyParser.raw());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Adding routes
let index = require('./routes/index.js');
let pita = require('./routes/pita-router.js');

// Adding Sign In With Google routes unless we run local
let tenant= "me";
if(! (process.env.ENV==="local")) {
  let ddl=`
    Create Table if not exists AuthorizedUsers (
		id UUID NOT NULL DEFAULT gen_random_uuid(),
    email TEXT,
    tenant TEXT DEFAULT `+tenant+`,
    authorized boolean DEFAULT false);`

  // Insert into AuthorizedUsers (email, authorized) values (encrypt($1::bytes, $2::bytes, 'aes'), true);
  // $1= email, $2= encyption key

  executeSQL(ddl);

  async function isAuthorized(email) {
    let query= "Select authorized from AuthorizedUsers where $3=convert_from(decrypt(email::bytes, $2::bytes, 'aes'), 'UTF-8') and tenant=$1;"
    let result= await executeSQL(query, [tenant, process.env.CODE, email]);
    if(result== null || result== undefined || result.length== 0)
      return false;
    return result[0].authorized;
  }
  setupIndexForAuth(index,'/app/pita.html', isAuthorized);
}

// Only requiring proper auth for non local
if(process.env.ENV==="local") {
  console.log("Local env. No auth");
}
else  {
  global.logger.log("info", "Requiring Authorization");
  app.use('/app', authRequired);
  app.use('/pita', authRequired);
}

app.use('/', index);
if(process.env.ENV==="local") {
index.get(
  '/logout', (req, res, next) => {
      let start = Date.now();
      global.logger.log("info", "Local user logged out.");
      res.redirect("/");
      global.httpRequestDurationMilliseconds
          .labels(req.route.path, res.statusCode, req.method)
          .observe(new Date() - start);
  });
}

pita.initPita(executeSQL, tenant, process.env.CODE);
app.use("/pita", pita);

// Handling 404
app.use(function (req, res, next) {
  let start = new Date();
  let err = new Error('Not Found');
  err.status = 404;
  err.route = "/";
  err.route.path = "/";
  let url_parts = url.parse(req.url);
  next(err);
  global.httpRequestDurationMilliseconds
  .labels(url_parts.pathname, err.status, req.method)
  .observe(new Date() - start);
});


// error handler
app.use(function (err, req, res, next) {
  let start = new Date();
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = (req.app.get('env') === 'development' || process.env.ENV === 'local') ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error', { message: err.message, error: err, route: req.url  });
  global.httpRequestDurationMilliseconds
    .labels(req.url, res.statusCode, req.method)
    .observe(new Date() - start);
 });

 // helper function 
 global.getUser= function (req) {
  let user= "local";
  if(process.env.ENV!='local')
    user= req.session.passport.user.email.value;
  return user;
}


module.exports = app;
