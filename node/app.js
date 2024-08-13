var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const basicAuth = require('express-basic-auth');
const axios = require("axios");
var url  = require('url');
var http = require('http');
var fs = require('fs');

var bodyParser = require('body-parser');
var app = express();
global.app = app;

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

function requireHTTPS(req, res, next) {
  // The 'x-forwarded-proto' check is for Heroku
  if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development") {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
}
function extractProfile(profile) {
  let imageUrl = '';
  if (profile.photos && profile.photos.length) {
    imageUrl = profile.photos[0].value;
  }
  return {
    id: profile.id,
    displayName: profile.displayName,
    image: imageUrl,
    email: profile.emails[0]
  };
}


let config;

try {
  config = JSON.parse(process.env.CONFIG);
}
catch (ex) {
  if (config == undefined) {
    console.log("error", "No CONFIG or broken: " + process.env.CONFIG);
  }
  config = { "OAUTH2_CLIENT_ID": "none", "OAUTH2_CLIENT_SECRET": "xxx", "OAUTH2_CALLBACK": "http://localhost:3000/auth/google/callback" }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: config.OAUTH2_CLIENT_ID,
      clientSecret: config.OAUTH2_CLIENT_SECRET,
      callbackURL: config.OAUTH2_CALLBACK,
      accessType: 'offline',
      userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    (accessToken, refreshToken, profile, cb) => {
      cb(null, extractProfile(profile));
    }
  )
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});

let store = new session.MemoryStore();

const sessionConfig = {
  resave: false,
  saveUninitialized: false,
  secret: config.OAUTH2_CLIENT_SECRET,
  signed: true,
  store: store
};

app.use(session(sessionConfig));
global.sessionstore = store;
require("./o11y");
//app.use(requireHTTPS);

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
app.use(passport.initialize());
app.use(passport.session());

// Middleware that requires the user to be logged in. If the user is not logged
// in, it will redirect the user to authorize the application and then return
// them to the original URL they requested.
function authRequired(req, res, next) {
  console.log("Auth required")
  if (!req.user) {
    if (req.session.authorizedByKey == true) {
      next();
      return;
    }
    req.session.oauth2return = req.originalUrl;
    console.log("Redirect to auth/login");
    return res.redirect('/auth/login');
  }
  next();
}

// Middleware that exposes the user's profile as well as login/logout URLs to
// any templates. These are available as `profile`, `login`, and `logout`.
function addTemplateVariables(req, res, next) {
  res.locals.profile = req.user;
  res.locals.login = `/auth/login?return=${encodeURIComponent(
    req.originalUrl
  )}`;
  res.locals.logout = `/auth/logout?return=${encodeURIComponent(
    req.originalUrl
  )}`;
  next();
}

if(process.env.ENV==="local") {
  console.log("Local env. No auth");
}
else  {
  console.log("Setup Auth...");
  app.use('/app', authRequired);
  app.use('/app/*', authRequired);
  app.use('/app/pita.html', authRequired);
  app.use('/pita', authRequired);
  app.use('/pita/*', authRequired);
}
let index = require('./routes/index.js');
let pita = require('./routes/pita-router.js');

app.use('/', index);

const { executeSQL } = require("./private/persistence.js");
pita.initPita(executeSQL, "me", process.env.CODE);


app.use("/pita", pita);


app.use(function (req, res, next) {
  let start = new Date();
  var err = new Error('Not Found');
  err.status = 404;
  err.route = "/";
  err.route.path = "/";
  var url_parts = url.parse(req.url);
  next(err);
  global.httpRequestDurationMilliseconds
  .labels(url_parts.pathname, err.status, req.method)
  .observe(new Date() - start);
});


index.get(
  // Login url
  '/auth/login',

  // Save the url of the user's current page so the app can redirect back to
  // it after authorization
  (req, res, next) => {
    console.log("auth/login");
    let start= Date.now();
 
    if (req.query.return) {
      req.session.oauth2return = req.query.return;
    }
    next();
    global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
  
  },

  // Start OAuth 2 flow using Passport.js
  passport.authenticate('google', { scope: ['email', 'profile'] })

);
index.get( 
  '/logout', (req, res, next) => {
    let start= Date.now();
    if (req.session) {
      global.logger.log("info", "User logged out: " + JSON.stringify(req.session.passport));
      req.session.destroy(err => {
      });
    } else {
      res.end()
    }
    res.redirect("/");
    global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
  });

index.get(
 
  // OAuth 2 callback url. Use this url to configure your OAuth client in the
  // Google Developers console
  '/auth/google/callback',
  // Finish OAuth 2 flow using Passport.js
  passport.authenticate('google'),
  // Redirect back to the original page, if any
  (req, res) => {
    let start= Date.now();

    let redirect = req.session.oauth2return || '/app/pita.html';
    if (!process.env.GOOGLE_USERS.split(",").includes(req.session.passport.user.email.value)) {
      redirect = "/nouser";
      delete req.session.passport;
    }
    global.logger.log("info", "User logged in: " + JSON.stringify(req.session.passport));
   
    delete req.session.oauth2return;
    res.redirect(redirect);
    global.httpRequestDurationMilliseconds
    .labels(req.route.path, res.statusCode, req.method)
    .observe(new Date() - start);
  }
);

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

 global.getUser= function (req) {
  let user= "local";
  if(process.env.ENV!='local')
    user= req.session.passport.user.email.value;
  return user;
}


module.exports = app;
