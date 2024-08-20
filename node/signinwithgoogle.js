// Setup Sign in With Google 

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
let app= global.app;

app.use(passport.initialize());

let config;
let store;

try {
    config = JSON.parse(process.env.CONFIG);
}
catch (ex) {
    if (config == undefined) {
        console.log("error", "No CONFIG or broken: " + process.env.CONFIG);
    }
    config = { "OAUTH2_CLIENT_ID": "none", "OAUTH2_CLIENT_SECRET": "xxx", "OAUTH2_CALLBACK": "http://localhost:3000/auth/google/callback" }
}

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


// Middleware that requires the user to be logged in. If the user is not logged
// in, it will redirect the user to authorize the application and then return
// them to the original URL they requested.
function authRequired(req, res, next) {
    if (!req.user) {
        if (req.session.authorizedByKey == true) {
            next();
            return;
        }
        req.session.oauth2return = req.originalUrl;
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

function setupIndexForAuth(index, defaultPath, isAuthorized) {
    index.get(
        // Login url
        '/auth/login',
        // Save the url of the user's current page so the app can redirect back to
        // it after authorization
        (req, res, next) => {
            console.log("auth/login");
            let start = Date.now();

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
            let start = Date.now();
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
        async (req, res) => {
            let start = Date.now();

            let redirect = req.session.oauth2return || defaultPath;
            if (!await isAuthorized(req.session.passport.user.email.value)) {
                redirect = "/nouser";
                global.logger.log("error", "Access denied: "+req.session.passport.user.email.value);
                delete req.session.passport;

            }
            else {
                global.logger.log("info", "Access allowed: " + req.session.passport.user.email.value);
            }
            delete req.session.oauth2return;
            res.redirect(redirect);
            global.httpRequestDurationMilliseconds
                .labels(req.route.path, res.statusCode, req.method)
                .observe(new Date() - start);
        }
    );
}

function setupSession(app, session) {
    store = new session.MemoryStore();

    const sessionConfig = {
        resave: false,
        saveUninitialized: false,
        secret: config.OAUTH2_CLIENT_SECRET,
        signed: true,
        store: store
    };

    app.use(session(sessionConfig));
    app.use(passport.session());
}

exports.setupSession = setupSession;
exports.setupIndexForAuth = setupIndexForAuth;
exports.authRequired = authRequired;
/* Sign-In With Google  done */
